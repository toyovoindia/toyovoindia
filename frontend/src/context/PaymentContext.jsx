import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getMyAccountData, updateMyAccountData } from '../services/userAccountApi';

const PaymentContext = createContext();

export function PaymentProvider({ children }) {
  const { user } = useAuth();

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [savedMethods, setSavedMethods] = useState({
    bankAccounts: [],
    upiIds: [],
    cards: []
  });
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      if (user) {
        try {
          const data = await getMyAccountData();
          if (!isMounted) return;
          setPaymentHistory(data.paymentHistory || []);
          setSavedMethods(data.paymentVault || { bankAccounts: [], upiIds: [], cards: [] });
          return;
        } catch {
          // If fetch fails, keep empty state, don't overwrite DB
          if (isMounted) {
            setPaymentHistory([]);
            setSavedMethods({ bankAccounts: [], upiIds: [], cards: [] });
          }
        }
      } else {
        // Read guest local storage
        const savedMethodsData = localStorage.getItem('TOYOVOINDIA_saved_methods_guest');
        const savedPaymentHistory = localStorage.getItem('TOYOVOINDIA_payment_history_guest');
        if (isMounted) {
          setPaymentHistory(savedPaymentHistory ? JSON.parse(savedPaymentHistory) : []);
          setSavedMethods(savedMethodsData ? JSON.parse(savedMethodsData) : {
            bankAccounts: [],
            upiIds: [],
            cards: []
          });
        }
      }
    };

    hydrate();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Database Sync Helpers
  const persistPaymentVault = async (newMethods) => {
    setSavedMethods(newMethods);
    if (user) {
      try {
        await updateMyAccountData({ paymentVault: newMethods });
      } catch (err) {
        console.error('Failed to sync payment vault to DB', err);
      }
    } else {
      localStorage.setItem('TOYOVOINDIA_saved_methods_guest', JSON.stringify(newMethods));
    }
  };

  const persistPaymentHistory = async (newHistory) => {
    setPaymentHistory(newHistory);
    if (user) {
      try {
        await updateMyAccountData({ paymentHistory: newHistory });
      } catch (err) {
        console.error('Failed to sync payment history to DB', err);
      }
    } else {
      localStorage.setItem('TOYOVOINDIA_payment_history_guest', JSON.stringify(newHistory));
    }
  };

  const addPaymentLog = (log) => {
    const newLog = { 
      id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`, 
      date: new Date().toLocaleDateString(), 
      status: 'Completed',
      ...log 
    };
    persistPaymentHistory([newLog, ...paymentHistory]);
  };

  const addSavedMethod = (type, data) => {
    const newMethods = {
      ...savedMethods,
      [type]: [{ id: Date.now().toString(), ...data }, ...savedMethods[type]]
    };
    persistPaymentVault(newMethods);
  };

  const deleteSavedMethod = (type, id) => {
    const newMethods = {
      ...savedMethods,
      [type]: savedMethods[type].filter(m => m.id !== id)
    };
    persistPaymentVault(newMethods);
  };

  // Orders are handled by backend typically, but keeping mock local state for now
  useEffect(() => {
    const savedOrders = localStorage.getItem('TOYOVOINDIA_orders_mock');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('TOYOVOINDIA_orders_mock', JSON.stringify(orders));
  }, [orders]);

  const addOrder = (orderData) => {
    const newOrder = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString(),
      status: 'Processing',
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      ...orderData
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const cancelOrder = (orderId) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'Cancelled' } : order
    ));
    const order = orders.find(o => o.id === orderId);
    if (order && order.status !== 'Cancelled') {
      addPaymentLog({ type: 'Refund', amount: order.total, method: `REFUND (${orderId})` });
    }
  };

  const simulatePayment = async (amount, method) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        addPaymentLog({ type: 'Debit', amount, method: method.toUpperCase() });
        resolve(true);
      }, 3000);
    });
  };

  return (
    <PaymentContext.Provider value={{ 
      paymentHistory, 
      savedMethods,
      orders,
      addSavedMethod,
      deleteSavedMethod,
      simulatePayment,
      addPaymentLog,
      addOrder,
      cancelOrder
    }}>
      {children}
    </PaymentContext.Provider>
  );
}

export const usePayment = () => useContext(PaymentContext);
