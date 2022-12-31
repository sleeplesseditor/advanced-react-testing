import userEvent from "@testing-library/user-event";
import {
  DefaultRequestBody,
  RequestParams,
  ResponseComposition,
  rest,
  RestContext,
  RestRequest,
} from "msw";

import { App } from "../../../App";
import { baseUrl, endpoints } from "../../../app/axios/constants";
import { handlers } from "../../../mocks/handlers";
import { server } from "../../../mocks/server";
import { getByRole, render, screen, waitFor } from "../../../test-utils";

test.each([
  { route: "/profile" },
  { route: "/tickets/0" },
  { route: "/confirm/0?holdId=1234&seatCount=2" },
])(
  "redirects to sign-in page from /profile when not authenticated",
  ({ route }) => {
    render(<App />, { routeHistory: [route] });
    const signInHeader = screen.getByRole("heading", { name: /sign in/i });
    expect(signInHeader).toBeInTheDocument();
  }
);

test.each([
  { testName: "sign in", buttonName: /sign in/i },
  { testName: "sign up", buttonName: /sign up/i },
])("succesful $testName flow", async ({ buttonName }) => {
  const { history } = render(<App />, { routeHistory: ["/tickets/1"] });

  const emailField = screen.getByLabelText(/email/i);
  userEvent.type(emailField, "test@test.com");

  const passwordField = screen.getByLabelText(/password/i);
  userEvent.type(passwordField, "blah");

  const signInForm = screen.getByTestId("sign-in-form");
  const signInButton = getByRole(signInForm, "button", { name: buttonName });
  userEvent.click(signInButton);

  await waitFor(() => {
    expect(history.location.pathname).toBe("/tickets/1");
    expect(history.entries).toHaveLength(1);
  });
});

const signInFailure = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition,
  ctx: RestContext
) => res(ctx.status(401));

const serverError = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition,
  ctx: RestContext
) => res(ctx.status(500));

const signUpFailure = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition,
  ctx: RestContext
) => res(ctx.status(400), ctx.json({ message: "Email is already in use" }));

test.each([
  {
    endpoint: endpoints.signIn,
    outcome: "failure",
    responseResolver: signInFailure,
    buttonNameRegex: /sign in/i,
  },
  {
    endpoint: endpoints.signIn,
    outcome: "server error",
    responseResolver: serverError,
    buttonNameRegex: /sign in/i,
  },
  {
    endpoint: endpoints.signUp,
    outcome: "failure",
    responseResolver: signUpFailure,
    buttonNameRegex: /sign up/i,
  },
])(
  "$endpoint $outcome followed by success",
  async ({ endpoint, responseResolver, buttonNameRegex }) => {
    const errorHandler = rest.post(`${baseUrl}/${endpoint}`, responseResolver);
    server.resetHandlers(...handlers, errorHandler);

    const { history } = render(<App />, { routeHistory: ["/tickets/1"] });

    const emailField = screen.getByLabelText(/email/i);
    userEvent.type(emailField, "test@test.com");

    const passwordField = screen.getByLabelText(/password/i);
    userEvent.type(passwordField, "blah");

    const actionForm = screen.getByTestId("sign-in-form");
    const actionButton = getByRole(actionForm, "button", {
      name: buttonNameRegex,
    });
    userEvent.click(actionButton);

    server.resetHandlers();
    userEvent.click(actionButton);

    await waitFor(() => {
      expect(history.location.pathname).toBe("/tickets/1");
      expect(history.entries).toHaveLength(1);
    });
  }
);
