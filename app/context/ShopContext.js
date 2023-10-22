import { createContext, useContext } from "react";

const ShopContext = createContext({
  shop: "",
  setShop: () => { console.warn("setShop has not been initialized yet"); },
});

export const useShop = () => {
  return useContext(ShopContext);
};

export const ShopProvider = ShopContext.Provider;  
