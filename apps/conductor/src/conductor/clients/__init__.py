"""External clients used by Conductor workflows.

Each client wraps a third-party SDK (anthropic, fastmcp, github MCP) with a
narrower, test-friendly interface. Production paths and test fakes implement
the same Protocol.
"""
