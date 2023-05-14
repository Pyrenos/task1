import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    idCount: 0,
    products: {},
};

const getSubIds = (products, id) => {
    let result = products[id];
    products[id].forEach(cId => {
        result.concat(getSubIds(products, cId));
    });
    return result;
}

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        addProduct: (state, action) => {
            if (action.payload.id != null && action.payload.id >= 0) {
                if (action.payload.id >= state.idCount) {
                    state.idCount = action.payload.id + 1;
                }
            } else {
                action.payload.id = state.idCount;
            }
            if (action.payload.parentId != null){
                state.products[action.payload.parentId].childIds.push(state.idCount);
            }
            state.products[state.idCount] = action.payload;
            state.idCount += 1;
        },
        changeHierarchy: (state, action) => {
            let currentElement = state.products[action.payload.currentId];
            if (currentElement.parentId != null) {
                let newChildIds = state.products[currentElement.parentId].childIds.filter(id => id !== currentElement.id)
                state.products[currentElement.parentId].childIds = newChildIds;
                currentElement.parentId = null;
            }
            if (action.payload.newParentId != null) {
                let newParent = state.products[action.payload.newParentId];
                newParent.childIds.push(currentElement.id);
                currentElement.parentId = newParent.id;
            }
        },
        deleteProduct: (state, action) => {
            let idsToRemove=[action.payload.id];
            let startElement = state.products[action.payload.id];
            if (startElement.parentId != null) {
                let newChildIds = state.products[startElement.parentId].childIds.filter(id => id !== startElement.id)
                state.products[startElement.parentId].childIds = newChildIds;
            }
            if (startElement.childIds.length > 0) {
                let productDict = {};
                Object.values(state.products).forEach(p => {
                    productDict[p.id] = p.childIds.map(id => id)
                })
                idsToRemove.concat(getSubIds(productDict, startElement.id));
            }
            let allowedIds = Object.values(state.products).map(p => p.id).filter(id => !idsToRemove.includes(id));
            let result = {};
            allowedIds.forEach(id => {
                result[id] = state.products[id];
            });
            state.products = result;
        },
        setProducts: (state, action) => {
            state.idCount = Math.max(...Object.values(action.payload).map(p => p.id)) + 1;
            state.products = action.payload;
        }
    },
});

export const { addProduct , changeHierarchy, deleteProduct, setProducts} = productsSlice.actions;

export default productsSlice.reducer;

export const selectProducts = (state) => state.products.products;

export const selectidCount = (state) => state.products.idCount;
