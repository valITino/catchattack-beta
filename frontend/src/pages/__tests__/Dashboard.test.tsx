import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";

vi.mock("../../lib/api", () => ({
  withAuth: () => ({
    coverage: () => Promise.resolve([]),
    priorities: () => Promise.resolve([])
  })
}));

import Dashboard from "../Dashboard";

describe("Dashboard", () => {
  it("renders header", () => {
    const { getByText } = render(<Dashboard />);
    expect(getByText(/catchattack-beta/i)).toBeTruthy();
  });
});
