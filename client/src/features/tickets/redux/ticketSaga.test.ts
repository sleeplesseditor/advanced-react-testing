import { PayloadAction } from "@reduxjs/toolkit";
import axios, { CancelTokenSource } from "axios";
import { SagaIterator } from "redux-saga";
import {
  call,
  cancel,
  cancelled,
  put,
  race,
  select,
  take,
  takeEvery,
} from "redux-saga/effects";
import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";
import { StaticProvider, throwError } from "redux-saga-test-plan/providers";

import {
  holdReservation,
  purchasePayload,
  purchaseReservation,
} from "../../../test-utils/fake-data";
import { showToast } from "../../toast/redux/toastSlice";
import {
  cancelPurchaseServerCall,
  releaseServerCall,
  reserveTicketServerCall,
} from "../api";
import { TicketAction } from "../types";
import {
  cancelTransaction,
  generateErrorToastOptions,
  purchaseTickets,
  ticketFlow,
} from "./ticketSaga";
import {
  endTransaction,
  resetTransaction,
  selectors,
  startTicketAbort,
  startTicketPurchase,
  startTicketRelease,
} from "./ticketSlice";

const holdAction = {
  type: "test",
  payload: holdReservation,
};

const networkProviders: Array<StaticProvider> = [
  [matchers.call.fn(reserveTicketServerCall), null],
  [matchers.call.fn(releaseServerCall), null],
  [matchers.call.fn(cancelPurchaseServerCall), null],
];

test("cancelTransaction cancels hold and resets transaction", () => {
  return expectSaga(cancelTransaction, holdReservation)
    .provide(networkProviders)
    .call(releaseServerCall, holdReservation)
    .put(resetTransaction())
    .run();
});

describe("common to all flows", () => {
  test("starts with hold call to server", () => {
    return expectSaga(ticketFlow, holdAction)
      .provide(networkProviders)
      .dispatch(
        startTicketAbort({ reservation: holdReservation, reason: "Abort!" })
      )
      .call(reserveTicketServerCall, holdReservation)
      .run();
  });

  test("show error toast and clean up after server error", () => {
    return expectSaga(ticketFlow, holdAction)
      .provide([
        [
          matchers.call.fn(reserveTicketServerCall),
          throwError(new Error("did not work")),
        ],
        [
          matchers.select.selector(selectors.getTicketAction),
          TicketAction.hold,
        ],
        ...networkProviders,
      ])
      .put(
        showToast(generateErrorToastOptions("did not work", TicketAction.hold))
      )
      .call(cancelTransaction, holdReservation)
      .run();
  });
});

describe("purchase flow", () => {
  test("network error on purchase shows toast and cancels transaction", () => {
    return expectSaga(ticketFlow, holdAction)
      .provide([
        [
          matchers.call.like({
            fn: reserveTicketServerCall,
            args: [purchaseReservation],
          }),
          throwError(new Error("did not work")),
        ],
        [
          matchers.select.selector(selectors.getTicketAction),
          TicketAction.hold,
        ],
        ...networkProviders,
      ])
      .dispatch(startTicketPurchase(purchasePayload))
      .call.fn(cancelPurchaseServerCall)
      .put(
        showToast(generateErrorToastOptions("did not work", TicketAction.hold))
      )
      .call(cancelTransaction, holdReservation)
      .run();
  });

  test("abort purchase while call to server is running", () => {
    const cancelSource = axios.CancelToken.source();
    return expectSaga(purchaseTickets, purchasePayload, cancelSource)
      .provide([
        ...networkProviders,
        {
          race: () => ({ abort: true }),
        },
      ])
      .call(cancelSource.cancel)
      .call.fn(releaseServerCall)
      .call.fn(cancelPurchaseServerCall)
      .not.put(showToast({ title: "tickets purchased", status: "success" }))
      .put(showToast({ title: "purchase cancelled", status: "warning" }))
      .put(resetTransaction())
      .run();
  });

  test("successful purchase flow", () => {
    const cancelSource = axios.CancelToken.source();
    return expectSaga(purchaseTickets, purchasePayload, cancelSource)
      .provide(networkProviders)
      .call(reserveTicketServerCall, purchaseReservation, cancelSource.token)
      .call(releaseServerCall, holdReservation)
      .put(showToast({ title: "tickets purchased", status: "success" }))
      .put(endTransaction())
      .not.call.fn(cancelSource.cancel)
      .not.call.fn(cancelPurchaseServerCall)
      .not.put(showToast({ title: "purchase cancelled", status: "warning" }))
      .run();
  });
});

describe("hold cancellation", () => {
  test.each([
    { name: "cancel", actionCreator: startTicketRelease },
    { name: "abort", actionCreator: startTicketAbort },
  ])(
    // Awaiting Jest update to interpolate name for $name
    "cancels holds and resets ticket transactions on $name",
    async ({ actionCreator }) => {
      return expectSaga(ticketFlow, holdAction)
        .provide(networkProviders)
        .dispatch(
          actionCreator({ reservation: holdReservation, reason: "test" })
        )
        .call(reserveTicketServerCall, holdReservation)
        .put(showToast({ title: "test", status: "warning" }))
        .call(cancelTransaction, holdReservation)
        .run();
    }
  );
});
