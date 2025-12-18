import { create } from 'zustand';
import { Shipment, ShipmentStatus, UserProfile, ViewState, Incoterm, ExportReason, ProductCatalogItem } from './types';

interface AppState {
  user: UserProfile | null;
  shipments: Shipment[];
  catalog: ProductCatalogItem[];
  currentView: ViewState;
  isLoginModalOpen: boolean;
  
  // Actions
  setView: (view: ViewState) => void;
  addShipment: (shipment: Shipment) => void;
  addToCatalog: (item: Omit<ProductCatalogItem, 'id'>) => void;
  updateShipment: (id: string, data: Partial<Shipment>) => void;
  login: (email: string) => void;
  logout: () => void;
  setLoginModalOpen: (isOpen: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null, 
  shipments: [],
  catalog: [],
  currentView: 'DASHBOARD',
  isLoginModalOpen: false,

  setView: (view) => set({ currentView: view }),
  
  addShipment: (shipment) => set((state) => ({ 
    shipments: [shipment, ...state.shipments],
    user: state.user ? { ...state.user, shipmentsCount: state.user.shipmentsCount + 1 } : null
  })),

  addToCatalog: (item) => set((state) => {
    // Check if exists
    const exists = state.catalog.find(c => c.description.toLowerCase() === item.description.toLowerCase());
    if (exists) return state;
    return {
        catalog: [...state.catalog, { ...item, id: `cat_${Date.now()}` }]
    };
  }),
  
  updateShipment: (id, data) => set((state) => ({
    shipments: state.shipments.map(s => s.id === id ? { ...s, ...data } : s)
  })),
  
  login: (email) => set({
    user: {
      id: 'user_1',
      email,
      companyName: 'Acme Traders',
      address: '123 Export Lane, New York, NY 10001, USA',
      taxId: 'US-EIN-99-999999',
      defaultOrigin: 'USA',
      subscriptionTier: 'FREE',
      shipmentsCount: 2
    },
    // Redirect to Dashboard after login so user can see the download option immediately
    currentView: 'DASHBOARD',
    isLoginModalOpen: false
  }),
  
  logout: () => set({ user: null, currentView: 'DASHBOARD' }),
  
  setLoginModalOpen: (isOpen) => set({ isLoginModalOpen: isOpen })
}));