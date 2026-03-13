import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDialog from "./ConfirmDialog";

test("renders message", () => {
  render(
    <ConfirmDialog title="Confirm" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />
  );
  expect(screen.getByText("Are you sure?")).toBeInTheDocument();
});

test("calls onConfirm when Delete clicked", () => {
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog title="Confirm" message="msg" onConfirm={onConfirm} onCancel={() => {}} />
  );
  fireEvent.click(screen.getByText("Delete"));
  expect(onConfirm).toHaveBeenCalledOnce();
});

test("calls onCancel when Cancel clicked", () => {
  const onCancel = vi.fn();
  render(
    <ConfirmDialog title="Confirm" message="msg" onConfirm={() => {}} onCancel={onCancel} />
  );
  fireEvent.click(screen.getByText("Cancel"));
  expect(onCancel).toHaveBeenCalledOnce();
});

test("uses custom confirm label", () => {
  render(
    <ConfirmDialog title="Confirm" message="msg" onConfirm={() => {}} onCancel={() => {}} confirmLabel="Remove" />
  );
  expect(screen.getByText("Remove")).toBeInTheDocument();
});
