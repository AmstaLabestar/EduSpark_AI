import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StateCard } from "@/app/components/feedback/StateCard";

describe("StateCard", () => {
  it("renders title and description", () => {
    render(
      <StateCard
        title="Aucun contenu"
        description="Ajoute un cours pour commencer."
      />,
    );

    expect(screen.getByText("Aucun contenu")).toBeInTheDocument();
    expect(
      screen.getByText("Ajoute un cours pour commencer."),
    ).toBeInTheDocument();
  });
});
