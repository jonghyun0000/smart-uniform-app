'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { CartItem, OrderType } from '@/types/database';

interface CustomerState {
  // 고객 정보
  customer: {
    name: string;
    phone: string;
    grade: string;
    class_num: string;
    student_num: string;
    gender: '남' | '여' | '';
  };
  school_id: string;
  school_name: string;
  order_type: OrderType | '';
  // 장바구니
  cart: CartItem[];
  // UI 상태
  step: number;
}

type Action =
  | { type: 'SET_CUSTOMER'; payload: Partial<CustomerState['customer']> }
  | { type: 'SET_SCHOOL'; payload: { school_id: string; school_name: string } }
  | { type: 'SET_ORDER_TYPE'; payload: OrderType }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string } // variant_id
  | { type: 'UPDATE_CART_QTY'; payload: { variant_id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET' };

const initialState: CustomerState = {
  customer: { name: '', phone: '', grade: '', class_num: '', student_num: '', gender: '' },
  school_id: '',
  school_name: '',
  order_type: '',
  cart: [],
  step: 0,
};

function reducer(state: CustomerState, action: Action): CustomerState {
  switch (action.type) {
    case 'SET_CUSTOMER':
      return { ...state, customer: { ...state.customer, ...action.payload } };
    case 'SET_SCHOOL':
      return { ...state, school_id: action.payload.school_id, school_name: action.payload.school_name };
    case 'SET_ORDER_TYPE':
      return { ...state, order_type: action.payload };
    case 'ADD_TO_CART': {
      const existing = state.cart.findIndex(i => i.variant_id === action.payload.variant_id);
      if (existing >= 0) {
        const newCart = [...state.cart];
        const newQty = newCart[existing].quantity + action.payload.quantity;
        newCart[existing] = {
          ...newCart[existing],
          quantity: newQty,
          total_price: newCart[existing].unit_price * newQty,
        };
        return { ...state, cart: newCart };
      }
      return { ...state, cart: [...state.cart, action.payload] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(i => i.variant_id !== action.payload) };
    case 'UPDATE_CART_QTY': {
      const newCart = state.cart.map(i =>
        i.variant_id === action.payload.variant_id
          ? { ...i, quantity: action.payload.quantity, total_price: i.unit_price * action.payload.quantity }
          : i
      ).filter(i => i.quantity > 0);
      return { ...state, cart: newCart };
    }
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const CustomerContext = createContext<{
  state: CustomerState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('customer_state');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return init;
  });

  // sessionStorage에 상태 저장 (새로고침 대비)
  useEffect(() => {
    try {
      sessionStorage.setItem('customer_state', JSON.stringify(state));
    } catch {}
  }, [state]);

  return (
    <CustomerContext.Provider value={{ state, dispatch }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  return useContext(CustomerContext);
}

export function useCartCount() {
  const { state } = useCustomer();
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function useCartTotal() {
  const { state } = useCustomer();
  return state.cart.reduce((sum, item) => sum + item.total_price, 0);
}
