interface Toast {
  show(message: string): void;
}

type ErrorHandler = {
  handle(error: any): void;
};

class DefaultErrorHandler implements ErrorHandler {
  private toast: Toast;

  constructor(toast: Toast) {
    this.toast = toast;
  }

  handle(error: any): void {
    if (error.response) {
      this.toast.show(
        `Request failed with status code ${error.response.status}: ${error.response.data.message}`
      );
    } else if (error.request) {
      this.toast.show("No response received from the server.");
    } else {
      this.toast.show(`Error: ${error.message}`);
    }
  }
}

export default DefaultErrorHandler;
