import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import Activities from "./Activities";
import { renderWithProviders } from "../test/utils";
import * as api from "../lib/api";

vi.mock("../lib/api");

const ACTIVITIES = [
  { id: 1, name: "Running", points: 10, description: null, fields: [], deleted_at: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: 2, name: "Junk food", points: -5, description: null, fields: [], deleted_at: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.getActivities.mockResolvedValue([]);
});

test("shows loading state", () => {
  api.getActivities.mockImplementation(() => new Promise(() => {}));
  renderWithProviders(<Activities />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

test("shows empty state when no activities", async () => {
  renderWithProviders(<Activities />);
  expect(await screen.findByText(/No activities yet/)).toBeInTheDocument();
});

test("renders activity list with names and points", async () => {
  api.getActivities.mockResolvedValue(ACTIVITIES);
  renderWithProviders(<Activities />);
  expect(await screen.findByText("Running")).toBeInTheDocument();
  expect(screen.getByText("Junk food")).toBeInTheDocument();
  expect(screen.getByText("+10")).toBeInTheDocument();
  expect(screen.getByText("-5")).toBeInTheDocument();
});

test("opens create modal when New Activity clicked", async () => {
  renderWithProviders(<Activities />);
  fireEvent.click(screen.getByRole("button", { name: /New Activity/ }));
  expect(screen.getByRole("heading", { name: "New Activity" })).toBeInTheDocument();
});

test("opens edit modal when edit button clicked", async () => {
  api.getActivities.mockResolvedValue(ACTIVITIES);
  renderWithProviders(<Activities />);
  await screen.findByText("Running");
  const editButtons = screen.getAllByTitle("", { exact: false });
  // Click the pencil (edit) button on first activity
  const pencilButtons = screen.getAllByRole("button").filter(
    (b) => b.querySelector("svg") && !b.textContent
  );
  fireEvent.click(pencilButtons[1]); // first edit button (after fields button)
  expect(screen.getByRole("heading", { name: "Edit Activity" })).toBeInTheDocument();
});

test("opens confirm dialog when delete button clicked", async () => {
  api.getActivities.mockResolvedValue(ACTIVITIES);
  renderWithProviders(<Activities />);
  await screen.findByText("Running");
  // The confirm dialog message mentions the activity name
  const deleteButtons = screen.getAllByRole("button").filter(
    (b) => b.querySelector("svg") && !b.textContent
  );
  fireEvent.click(deleteButtons[2]); // trash button
  expect(screen.getByText(/Delete "Running"/)).toBeInTheDocument();
});
