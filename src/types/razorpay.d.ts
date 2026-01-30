export {};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }

  interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    handler: (response: any) => void;
    modal?: {
      ondismiss?: () => void;
    };
    theme?: {
      color?: string;
    };
  }
}
