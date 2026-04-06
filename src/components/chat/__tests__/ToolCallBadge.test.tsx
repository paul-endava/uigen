import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// str_replace_editor labels

test("shows 'Creating <filename>' for str_replace_editor create", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/components/Card.tsx" }}
      isDone={false}
    />
  );
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor str_replace", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/src/App.tsx" }}
      isDone={false}
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor insert", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "/src/App.tsx" }}
      isDone={true}
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("shows 'Reading <filename>' for str_replace_editor view", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "/src/index.tsx" }}
      isDone={true}
    />
  );
  expect(screen.getByText("Reading index.tsx")).toBeDefined();
});

test("shows 'Undoing edit in <filename>' for str_replace_editor undo_edit", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "undo_edit", path: "/src/Button.tsx" }}
      isDone={false}
    />
  );
  expect(screen.getByText("Undoing edit in Button.tsx")).toBeDefined();
});

// file_manager labels

test("shows 'Renaming <old> → <new>' for file_manager rename", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "/src/Old.tsx", new_path: "/src/New.tsx" }}
      isDone={true}
    />
  );
  expect(screen.getByText("Renaming Old.tsx → New.tsx")).toBeDefined();
});

test("shows 'Deleting <filename>' for file_manager delete", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/src/Unused.tsx" }}
      isDone={true}
    />
  );
  expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
});

// Fallback

test("falls back to tool name for unknown tools", () => {
  render(
    <ToolCallBadge
      toolName="some_unknown_tool"
      args={{}}
      isDone={false}
    />
  );
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

// Path edge cases

test("handles root-level path", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      isDone={false}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows fallback label when path is missing", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create" }}
      isDone={false}
    />
  );
  expect(screen.getByText("Creating file")).toBeDefined();
});

// Done state

test("renders done state without spinner", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.tsx" }}
      isDone={true}
    />
  );
  // Done state shows a green dot, no animate-spin
  expect(container.querySelector(".animate-spin")).toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("renders in-progress state with spinner", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.tsx" }}
      isDone={false}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
