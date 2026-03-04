#!/usr/bin/env python3
"""
CrewAI pipeline for Berkeley-focused resource discovery:
1) Scout agent finds credible sources on the web
2) Analyst agent extracts actionable details
3) Presenter agent summarizes for student-facing UI
"""

from __future__ import annotations

import argparse
import json
import os
import re
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

import requests
from bs4 import BeautifulSoup
from crewai import Agent, Crew, Process, Task
from crewai.tools import tool
from duckduckgo_search import DDGS


def _clean_text(value: str, max_len: int = 9000) -> str:
    normalized = re.sub(r"\s+", " ", value).strip()
    return normalized[:max_len]


def _normalize_result_url(href: str) -> str:
    if href.startswith("//"):
        href = "https:" + href

    # DuckDuckGo HTML sometimes returns redirect links with an encoded `uddg` target.
    if "duckduckgo.com/l/" in href:
        parsed = urlparse(href)
        qs = parse_qs(parsed.query)
        target = qs.get("uddg", [None])[0]
        if target:
            decoded = unquote(target)
            if decoded.startswith("http"):
                return decoded
    return href


@tool("Search Berkeley resources")
def search_berkeley_resources(query: str) -> str:
    """Find resource links for a user query with a Berkeley focus."""
    search_query = f"{query} berkeley student resource"
    results: list[dict[str, str]] = []
    try:
        with DDGS() as ddgs:
            for item in ddgs.text(search_query, max_results=8):
                href = item.get("href") or ""
                if not href.startswith("http"):
                    continue
                results.append(
                    {
                        "title": item.get("title", ""),
                        "url": href,
                        "snippet": item.get("body", ""),
                    }
                )
    except Exception:
        # Fall back to lightweight HTML parsing if DDGS fails in this environment.
        pass

    if not results:
        response = requests.get(
            "https://duckduckgo.com/html/",
            params={"q": search_query},
            timeout=14,
            headers={"User-Agent": "CalConnectCrew/1.0 (+resource search)"},
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        for block in soup.select(".result")[:10]:
            link = block.select_one(".result__a")
            snippet = block.select_one(".result__snippet")
            if not link:
                continue
            href = _normalize_result_url(link.get("href", ""))
            if not href.startswith("http"):
                continue

            results.append(
                {
                    "title": _clean_text(link.get_text(" ", strip=True), 180),
                    "url": href,
                    "snippet": _clean_text(
                        snippet.get_text(" ", strip=True) if snippet else "", 280
                    ),
                }
            )

    return json.dumps(results)


@tool("Extract page content")
def extract_page_content(url: str) -> str:
    """Download and clean text content from a URL."""
    response = requests.get(
        url,
        timeout=14,
        headers={"User-Agent": "CalConnectCrew/1.0 (+resource search)"},
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    main = soup.find("main")
    text = main.get_text(" ", strip=True) if main else soup.get_text(" ", strip=True)
    return _clean_text(text)


def _safe_json(raw: str, fallback: dict[str, Any]) -> dict[str, Any]:
    try:
        return json.loads(raw)
    except Exception:
        # Sometimes LLMs wrap JSON in markdown fences.
        cleaned = raw.strip().strip("`")
        try:
            return json.loads(cleaned)
        except Exception:
            return fallback


def _has_llm_credentials() -> bool:
    keys = [
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GROQ_API_KEY",
        "GEMINI_API_KEY",
    ]
    return any(os.getenv(key) for key in keys)


def _fallback_without_llm(query: str) -> dict[str, Any]:
    source_rows = _safe_json(search_berkeley_resources.run(query), [])
    sources = []
    insights: list[dict[str, str]] = []

    for row in source_rows[:4]:
        url = row.get("url", "")
        if not url:
            continue
        try:
            content = extract_page_content.run(url)
        except Exception:
            content = row.get("snippet", "")

        sources.append(
            {
                "title": row.get("title", url),
                "url": url,
                "why_relevant": row.get("snippet", "Potentially relevant Berkeley resource."),
            }
        )

        if content:
            insights.append({"label": "Details", "value": content[:220] + "..."})

    if not sources:
        sources = [
            {
                "title": f"Search results for {query} Berkeley resources",
                "url": f"https://duckduckgo.com/?q={query.replace(' ', '+')}+berkeley+student+resource",
                "why_relevant": "No direct sources were parsed in fallback mode; open this search URL for live results.",
            }
        ]
    if not insights:
        insights = [
            {
                "label": "Search guidance",
                "value": "Try adding specific terms like emergency fund, pantry, undocumented, housing, or deadline to improve source quality.",
            }
        ]

    return {
        "query": query,
        "summary": (
            "Configured CrewAI agents need an LLM API key. Returning live web results with "
            "basic extraction for now."
        ),
        "action_steps": [
            "Open the most relevant source link below.",
            "Check eligibility and required documents on the official page.",
            "Use the contact/application link to complete next steps.",
        ],
        "insights": insights[:6],
        "sources": sources[:5],
    }


def run_crew(query: str) -> dict[str, Any]:
    if not _has_llm_credentials():
        return _fallback_without_llm(query)

    llm_model = os.getenv("CREWAI_MODEL", "gpt-4o-mini")

    scout = Agent(
        role="Web Resource Scout",
        goal="Find the best Berkeley-relevant student resource pages for the user query.",
        backstory=(
            "You are an expert at locating credible university and nonprofit resource pages "
            "for students. You prioritize official campus pages and clear actionable links."
        ),
        tools=[search_berkeley_resources],
        llm=llm_model,
        allow_delegation=False,
        verbose=False,
    )

    analyst = Agent(
        role="Resource Analyst",
        goal=(
            "Extract practical student-facing details: eligibility, hours, documents, "
            "costs, application steps, and key constraints."
        ),
        backstory=(
            "You read web pages carefully and convert messy details into plain, accurate notes."
        ),
        tools=[extract_page_content],
        llm=llm_model,
        allow_delegation=False,
        verbose=False,
    )

    presenter = Agent(
        role="Student Summary Presenter",
        goal="Deliver a concise but information-rich summary that a student can act on immediately.",
        backstory=(
            "You specialize in student UX writing: clear, no jargon, focused on what to do next."
        ),
        llm=llm_model,
        allow_delegation=False,
        verbose=False,
    )

    scout_task = Task(
        description=(
            "User query: '{query}'. Use your tool to search the web and return the top 5 best links "
            "for Berkeley-related student resources. Output STRICT JSON list with fields: "
            "title, url, snippet."
        ).format(query=query),
        expected_output='JSON array of objects [{"title":"...","url":"...","snippet":"..."}]',
        agent=scout,
    )

    analyst_task = Task(
        description=(
            "Given the scout output links, use your extraction tool on the most relevant sources (up to 4). "
            "Produce STRICT JSON with:\n"
            "{\n"
            '  "sources":[{"title":"...","url":"...","why_relevant":"..."}],\n'
            '  "insights":[\n'
            "    {\"label\":\"Eligibility\",\"value\":\"...\"},\n"
            "    {\"label\":\"How to apply\",\"value\":\"...\"},\n"
            "    {\"label\":\"What to bring\",\"value\":\"...\"},\n"
            "    {\"label\":\"Costs/fees\",\"value\":\"...\"},\n"
            "    {\"label\":\"Deadlines/timing\",\"value\":\"...\"},\n"
            "    {\"label\":\"Gotchas\",\"value\":\"...\"}\n"
            "  ]\n"
            "}"
        ),
        expected_output='JSON object with keys "sources" and "insights".',
        agent=analyst,
        context=[scout_task],
    )

    presenter_task = Task(
        description=(
            "Create a student-facing final response from the analyst output. Output STRICT JSON:\n"
            "{\n"
            '  "query":"...","\n'
            '  "summary":"2-4 sentence high-value summary",\n'
            '  "action_steps":["...","..."],\n'
            '  "insights":[{"label":"...","value":"..."}],\n'
            '  "sources":[{"title":"...","url":"...","why_relevant":"..."}]\n'
            "}\n"
            "Keep language plain and actionable."
        ),
        expected_output='JSON object with query, summary, action_steps, insights, and sources.',
        agent=presenter,
        context=[analyst_task],
    )

    crew = Crew(
        agents=[scout, analyst, presenter],
        tasks=[scout_task, analyst_task, presenter_task],
        process=Process.sequential,
        verbose=False,
    )

    result = crew.kickoff()
    raw = str(result)
    fallback = {
        "query": query,
        "summary": "No structured summary was produced.",
        "action_steps": [],
        "insights": [],
        "sources": [],
    }
    parsed = _safe_json(raw, fallback)
    parsed.setdefault("query", query)
    parsed.setdefault("summary", "")
    parsed.setdefault("action_steps", [])
    parsed.setdefault("insights", [])
    parsed.setdefault("sources", [])
    return parsed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", required=True)
    args = parser.parse_args()
    output = run_crew(args.query)
    print(json.dumps(output))


if __name__ == "__main__":
    main()
