/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
  })

  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList).toContain('active-icon')
    })
  })

  describe("When I fill the form ", () => {
    let newBill
    beforeEach(() => {
      // Set up the new bill
      document.body.innerHTML = NewBillUI()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })
    })

    describe("When I upload a file", () => {
      let handleChangeFile
      beforeEach(() => {
        // Create the handleChangeFile mocked function
        handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      })
      test("Then handleChangeFile should be triggered ", async () => {

        // Get the input file element and add the event listener
        await waitFor(() => screen.getByTestId('file'))
        const inputFile = screen.getByTestId('file')

        inputFile.addEventListener('change', handleChangeFile)

        // Creation of the test file to upload
        const testFile = new File(['facture'], 'facture.jpg', { type: 'image/jpg' })

        // Simulate the file upload
        fireEvent.change(inputFile, {
          target: {
            files: [
              testFile
            ],
          },
        })

        // Check that the file name is displayed
        expect(screen.getByTestId('file').files[0].name).toBe('facture.jpg')
        // Check that handleChangeFile is called
        expect(handleChangeFile).toHaveBeenCalled()
        // Check formdata values
        expect(inputFile.files[0]).toEqual(testFile)
      })

      test("then upload a wrong file should trigger an error", async () => {
        // Get the input file element and add the event listener
        await waitFor(() => screen.getByTestId('file'))
        const inputFile = screen.getByTestId('file')

        inputFile.addEventListener('change', handleChangeFile)

        // Add test file to upload
        const testFile = new File(['facture'], 'facture.pdf', { type: 'document/pdf' })

        // Spy the console    
        const errorSpy = jest.spyOn(console, 'error')

        // Simulate the file upload
        fireEvent.change(inputFile, {
          target: {
            files: [
              testFile
            ],
          },
        })

        // Check that the error message is displayed in the console
        expect(errorSpy).toHaveBeenCalledWith("Le format du fichier n'est pas correct.")
      })
    })

    // POST integration test
    describe("When I click on the submit button", () => {
      test("Then it should create a new bill", () => {
        const customInputs = [
          {
            testId: "expense-type",
            value: "Transports"
          },
          {
            testId: "expense-name",
            value: "TGV Paris Marseille"
          },
          {
            testId: "datepicker",
            value: "2023-04-21"
          },
          {
            testId: "amount",
            value: "100"
          },
          {
            testId: "vat",
            value: 80
          },
          {
            testId: "pct",
            value: 20
          },
          {
            testId: "commentary",
            value: "Trajet professionnel"
          }
        ]

        // Fill the form inputs with the custom values
        customInputs.forEach(input => fireEvent.change(screen.getByTestId(input.testId), {
          target: { value: input.value }
        }))

        // Spy the onNavigate and updateBill method 
        const spyOnNavigate = jest.spyOn(newBill, 'onNavigate')
        const spyUpdateBill = jest.spyOn(newBill, 'updateBill')
        // Mock the handleSubmit function
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", handleSubmit)
        // Submit the form
        fireEvent.submit(form)

        // Check that the handleSubmit function was called
        expect(handleSubmit).toHaveBeenCalled()

        // Check that the updateBill method was called with the right values
        expect(spyUpdateBill).toHaveBeenCalledWith(expect.objectContaining({
          type: "Transports",
          name: "TGV Paris Marseille",
          date: "2023-04-21",
          amount: 100,
          vat: "80",
          pct: 20,
          commentary: "Trajet professionnel",
          status: 'pending'
        }))

        // Check that the onNavigate method was called with the right path
        expect(spyOnNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])
        // Check that the page has changed to the bill page
        expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      })

    //   it("fetches bills from an API and fails with 404 message error", async () => {
    //     mockStore.bills.mockImplementationOnce(() => {
    //       return {
    //         list: () => {
    //           return Promise.reject(new Error("Erreur 404"));
    //         },
    //       };
    //     });
    //     window.onNavigate(ROUTES_PATH.Bills);
    //     await new Promise(process.nextTick);
    //     const message = await screen.getByTestId("error-message");
    //     expect(message).toHaveTextContent("404");
    //   });
    // it("fetches messages from an API and fails with 500 message error", async () => {
    //   mockStore.bills.mockImplementationOnce(() => {
    //     return {
    //       list: () => {
    //         return Promise.reject(new Error("Erreur 500"));
    //       },
    //     };
    //   });

    //   window.onNavigate(ROUTES_PATH.Bills);
    //   await new Promise(process.nextTick);
    //   const message = await screen.getByTestId("error-message");
    //   expect(message).toHaveTextContent("500");
    // });
    })
  })
})