import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import Log from "./Log";
import { renderWithProviders } from "../test/utils";
import * as api from "../lib/api";

vi.mock("../lib/api");

const ACTIVITY = { id: 1, name: "Running", points: 10, fields: [], deleted_at: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" };
const LOG_ENTRY = {
  id: 1,
  activity_id: 1,
  activity: { name: "Running" },
  date: "2026-01-01",
  notes: null,
  points_snapshot: 10,
  field_values: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  api.getLogs.mockResolvedValue([]);
  api.getActivities.mockResolvedValue([]);
});

test("shows loading state", () => {
  api.getLogs.mockImplementation(() => new Promise(() => {}));
  renderWithProviders(<Log />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

test("shows empty state when no log entries", async () => {
  renderWithProviders(<Log />);
  expect(await screen.findByText(/No entries yet/)).toBeInTheDocument();
});

test("Log Activity button is disabled when no activities exist", async () => {
  renderWithProviders(<Log />);
  await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: /Log Activity/ })).toBeDisabled();
});

test("Log Activity button is enabled when activities exist", async () => {
  api.getActivities.mockResolvedValue([ACTIVITY]);
  renderWithProviders(<Log />);
  await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: /Log Activity/ })).not.toBeDisabled();
});

test("renders log entries with activity name, date, and points", async () => {
  api.getLogs.mockResolvedValue([LOG_ENTRY]);
  api.getActivities.mockResolvedValue([ACTIVITY]);
  renderWithProviders(<Log />);
  expect(await screen.findByText("Running")).toBeInTheDocument();
  expect(screen.getByText("2026-01-01")).toBeInTheDocument();
  expect(screen.getByText("+10")).toBeInTheDocument();
});

test("opens log modal when Log Activity clicked", async () => {
  api.getActivities.mockResolvedValue([ACTIVITY]);
  renderWithProviders(<Log />);
  await waitFor(() => expect(screen.getByRole("button", { name: /Log Activity/ })).not.toBeDisabled());
  fireEvent.click(screen.getByRole("button", { name: /Log Activity/ }));
  expect(screen.getByRole("heading", { name: "Log Activity" })).toBeInTheDocument();
});

test("opens confirm dialog when delete button clicked", async () => {
  api.getLogs.mockResolvedValue([LOG_ENTRY]);
  api.getActivities.mockResolvedValue([ACTIVITY]);
  renderWithProviders(<Log />);
  await screen.findByText("Running");
  const iconButtons = screen.getAllByRole("button").filter((b) => !b.textContent);
  fireEvent.click(iconButtons[iconButtons.length - 1]); // trash button (last icon button)
  expect(screen.getByText(/Remove this log entry for "Running"/)).toBeInTheDocument();
});
