import { screen } from "@testing-library/react";
import { vi } from "vitest";
import Progress from "./Progress";
import { renderWithProviders } from "../test/utils";
import * as api from "../lib/api";

vi.mock("../lib/api");

beforeEach(() => {
  vi.clearAllMocks();
  api.getProgressSummary.mockResolvedValue({ current_points: 0, all_time_points: 0 });
  api.getProgressLogs.mockResolvedValue([]);
  api.getProgressRedemptions.mockResolvedValue([]);
});

test("shows — placeholders while summary is loading", () => {
  api.getProgressSummary.mockImplementation(() => new Promise(() => {}));
  renderWithProviders(<Progress />);
  expect(screen.getAllByText("—")).toHaveLength(2);
});

test("displays current and all-time points from summary", async () => {
  api.getProgressSummary.mockResolvedValue({ current_points: 42, all_time_points: 100 });
  renderWithProviders(<Progress />);
  expect(await screen.findByText("42")).toBeInTheDocument();
  expect(screen.getByText("100")).toBeInTheDocument();
});

test("shows empty timeline message when no entries", async () => {
  renderWithProviders(<Progress />);
  expect(await screen.findByText(/No entries in this date range/)).toBeInTheDocument();
});

test("renders log entries in timeline", async () => {
  api.getProgressLogs.mockResolvedValue([
    { id: 1, activity_id: 1, activity: { name: "Running" }, date: "2026-01-01", notes: null, points_snapshot: 10, field_values: [] },
  ]);
  renderWithProviders(<Progress />);
  expect(await screen.findByText("Running")).toBeInTheDocument();
  expect(screen.getByText("+10")).toBeInTheDocument();
});

test("renders redemptions in timeline", async () => {
  api.getProgressRedemptions.mockResolvedValue([
    { id: 1, reward_id: 1, reward: { name: "Ice cream" }, redeemed_at: "2026-01-01T12:00:00Z", points_snapshot: 15, notes: null },
  ]);
  renderWithProviders(<Progress />);
  expect(await screen.findByText("Redeemed: Ice cream")).toBeInTheDocument();
  expect(screen.getByText("-15")).toBeInTheDocument();
});
