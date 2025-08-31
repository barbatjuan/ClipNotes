
import { useEffect, useRef, useCallback } from "react";

interface PaypalSubscribeButtonProps {
  planId: string;
  onApprove: (subscriptionId: string) => void;
}

export const PaypalSubscribeButton: React.FC<PaypalSubscribeButtonProps> = ({ planId, onApprove }) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  const buttonRendered = useRef(false);

  const renderButton = useCallback(() => {
    if (!(window as any).paypal || !paypalRef.current || buttonRendered.current) return;
    buttonRendered.current = true;
    (window as any).paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'gold',
        layout: 'vertical',
        label: 'subscribe'
      },
      createSubscription: function (data: any, actions: any) {
        return actions.subscription.create({
          plan_id: planId
        });
      },
      onApprove: function (data: any) {
        onApprove(data.subscriptionID);
      },
      onError: function (err: any) {
        // Puedes mostrar un toast o alerta aquí
        console.error('PayPal error:', err);
        alert('Ocurrió un error con PayPal. Intenta de nuevo.');
      }
    }).render(paypalRef.current);
  }, [planId, onApprove]);

  useEffect(() => {
    buttonRendered.current = false;
    // Limpieza total antes de renderizar
    if (paypalRef.current) {
      paypalRef.current.innerHTML = "";
    }
    // Esperar un tick para asegurar desmontaje completo
    const timeout = setTimeout(() => {
      if (!document.getElementById('paypal-sdk')) {
        const script = document.createElement('script');
        script.src = "https://www.paypal.com/sdk/js?client-id=AYTc-YuKuff0JzRTvLzYRuDmGoOHWzDPu8qGxhbyiiWBJ-gFQ4uIPq1EyoKDksK732rbkbLlpSc_D9b4&vault=true&intent=subscription";
        script.id = 'paypal-sdk';
        script.async = true;
        script.onload = () => {
          scriptLoaded.current = true;
          renderButton();
        };
        document.body.appendChild(script);
      } else {
        scriptLoaded.current = true;
        renderButton();
      }
    }, 50); // 50ms para asegurar limpieza
    return () => {
      clearTimeout(timeout);
      if (paypalRef.current) paypalRef.current.innerHTML = "";
      buttonRendered.current = false;
    };
  }, [planId, onApprove, renderButton]);

  return <div ref={paypalRef}></div>;
};
