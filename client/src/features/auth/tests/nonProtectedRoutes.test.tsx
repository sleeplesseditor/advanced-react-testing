import { App } from "../../../App";
import { render, screen } from "../../../test-utils";

test.each([
  { routeName: "Home", routePath: "/", headingMatch: /welcome/i },
  { routeName: "Band 1", routePath: "/bands/1", headingMatch: /joyous/i },
  { routeName: "Shows", routePath: "/shows", headingMatch: /upcoming/i },
  // $routeName does not work until Jest updated
])(
  "$routeName page does not redirect to login screen",
  async ({ headingMatch, routePath }) => {
    render(<App />, { routeHistory: [routePath] });
    const heading = await screen.findByRole("heading", {
      name: headingMatch,
    });
    expect(heading).toBeInTheDocument();
  }
);
