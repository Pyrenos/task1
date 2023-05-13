import './App.css';
import ProductView from "./features/ProductView/ProductView";
import React, { useMemo } from 'react';
const Context = React.createContext({
  name: 'Default',
});

function App() {
    const contextValue = useMemo(
        () => ({
            name: 'Ant Design',
        }),
        [],
    );
  return (<>
      <Context.Provider value={contextValue}>
          <ProductView />
      </Context.Provider>
  </>

  );
}

export default App;
