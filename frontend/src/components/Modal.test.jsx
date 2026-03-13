import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "./Modal";

test("renders title and children", () => {
  render(<Modal title="Test Modal" onClose={() => {}}>Content here</Modal>);
  expect(screen.getByText("Test Modal")).toBeInTheDocument();
  expect(screen.getByText("Content here")).toBeInTheDocument();
});

test("calls onClose when Escape pressed", () => {
  const onClose = vi.fn();
  render(<Modal title="Test" onClose={onClose}>Content</Modal>);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onClose).toHaveBeenCalledOnce();
});

test("calls onClose when backdrop clicked", () => {
  const onClose = vi.fn();
  const { container } = render(<Modal title="Test" onClose={onClose}>Content</Modal>);
  fireEvent.click(container.firstChild);
  expect(onClose).toHaveBeenCalledOnce();
});

test("calls onClose when X button clicked", () => {
  const onClose = vi.fn();
  render(<Modal title="Test" onClose={onClose}>Content</Modal>);
  fireEvent.click(screen.getByRole("button"));
  expect(onClose).toHaveBeenCalledOnce();
});
