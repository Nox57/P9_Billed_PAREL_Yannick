/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import '@testing-library/jest-dom'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

// Utilisation de jest.mock pour remplacer la véritable store par une version simulée (mock) 
jest.mock("../app/store", () => mockStore);

// Avant chaque test, nous définissons un localStorage fictif et y stockons des informations sur l'utilisateur connecté
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))
})

// Ensemble de tests pour un utilisateur connecté en tant qu'employé
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    // Test pour vérifier que l'icône des factures est mise en évidence
    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList).toContain('active-icon')
    })
    // Test pour vérifier que les factures sont classées par date, de la plus ancienne à la plus récente
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
    // Test pour vérifier que le clic sur le bouton "Nouvelle note de frais" charge la page pour envoyer une note de frais
    test("Then it should load new bill page", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      const buttonNewBill = screen.getByText('Nouvelle note de frais')
      fireEvent.click(buttonNewBill)
      const newBill = screen.getByText('Envoyer une note de frais')
      expect(newBill).toBeTruthy()
    })
    // Test pour vérifier qu'une modale s'affiche lorsqu'on clique sur l'icône
    test("Then is should display modal if I click on icon eye", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const modalFile = document.getElementById('modaleFile')
      $.fn.modal = jest.fn(() => modalFile.classList.add('show'))
      const eyeButton = screen.getAllByTestId('icon-eye')
      fireEvent.click(eyeButton[1])
      const url = eyeButton[1].dataset.billUrl
      const modal = screen.getByAltText('Bill')
      const modalSrc = modal.src.replace('%E2%80%A6','…')
      expect(modal).toBeVisible()
      expect(modalFile).toHaveClass('show')
      expect(modalSrc).toBe(url)
    })
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    // Test pour s'assurer que les factures sont bien récupérées via l'API
    it("then fetch bills mock API GET", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const title = screen.getByText("Mes notes de frais");

      expect(title).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      // Test pour s'assurer qu'une erreur 404 renvoie le message d'erreur approprié
      it("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByTestId("error-message");
        expect(message).toHaveTextContent("404");
      });
    });
    // Test pour s'assurer qu'une erreur 500 renvoie le message d'erreur approprié
    it("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByTestId("error-message");
      expect(message).toHaveTextContent("500");
    });
  });
});
