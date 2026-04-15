import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Notice } from "@/app/components/feedback/Notice";

describe("Notice", () => {
  it("renders the message", () => {
    render(<Notice message="Une erreur est survenue" tone="error" />);

    expect(screen.getByText("Une erreur est survenue")).toBeInTheDocument();
  });

  it("applies the tone style", () => {
    const { container } = render(
      <Notice message="Cours cree" tone="success" />,
    );

    expect(container.firstChild).toHaveClass("bg-green-50");
  });
});
