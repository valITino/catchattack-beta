import { describe, it, expect, vi } from "vitest";
vi.mock("../lib/api", () => ({
  withAuth: () => ({
    coverage: () => Promise.resolve([]),
    priorities: () => Promise.resolve([])
  })
}), { virtual: true });
import React from "react";
import { render } from "@testing-library/react";
import Dashboard from "../Dashboard";

describe("Dashboard", () => {
  it("renders header", () => {
    const { getByText } = render(<Dashboard />);
    expect(getByText(/catchattack-beta/i)).toBeTruthy();
  });
});
