import { App } from "../../../App";
import { fireEvent, render, screen } from "../../../test-utils";

test("redirect to /tickets/:showId if seatCount is missing", () => {
  const { history } = render(<App />, {
    preLoadedState: { user: { userDetails: { email: "test@test.com" } } },
    routeHistory: ["/confirm/0?holdId=12345"],
  });
  expect(history.location.pathname).toBe("/tickets/0");
});
