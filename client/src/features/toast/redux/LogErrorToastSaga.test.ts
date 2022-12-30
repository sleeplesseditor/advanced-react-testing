import { expectSaga } from "redux-saga-test-plan";

import { ToastOptions } from "../types";
import { logErrorToasts, sendToAnalytics } from "./LogErrorToastSaga";

const errorToastOptions: ToastOptions = {
  title: "It is time to panic!",
  status: "error",
};

const infoToastOptions: ToastOptions = {
  title: "Nothing wrong",
  status: "success",
};

const errorToastAction = {
  type: "test",
  payload: errorToastOptions,
};

const infoToastAction = {
  type: "success",
  payload: infoToastOptions,
};

test("saga calls analytics when it receives an error toast", () => {
  return expectSaga(logErrorToasts, errorToastAction)
    .call(sendToAnalytics, "It is time to panic!")
    .run();
});

test("saga does not calls analytics when it receives an info toast", () => {
  return expectSaga(logErrorToasts, infoToastAction)
    .not.call.fn(sendToAnalytics)
    .run();
});
