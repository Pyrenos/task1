import React, { useState } from 'react';
import { selectProducts, setProducts } from "./productsSlice";
import { useSelector, useDispatch } from 'react-redux';
import { Button, notification, Upload, Col, Row, Card  } from 'antd';
import './productView.css'
import ProductTreeView from "./ProductTreeView";
import ProductViewDialog from "./ProductViewDialog";
const ProductView = () => {
    const [api] = notification.useNotification();
    const [selectedId, setSelectedId] = useState(null);
    const products = useSelector(selectProducts);
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const showModal = () => {
        setIsModalOpen(true);
    };

    const exportData = () => {
        const blob = new Blob([JSON.stringify(products)], { type: "json" })
        const a = document.createElement('a')
        a.download = "ProductsData.json";
        a.href = window.URL.createObjectURL(blob)
        const clickEvt = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
        })
        a.dispatchEvent(clickEvt)
        a.remove()
    };

    function hasLoop(productsToCheck) {
        const passedIds = {};
        function dfs(p) {
            passedIds[p.id] = true;
            for (const childId of p.childIds) {
                if (passedIds[childId] === true) {
                    return true;
                }
                const child = productsToCheck.find(p_ => p_.id === childId);
                if (dfs(child)) {
                    return true;
                }
            }
            return false;
        }
        let result = false;
        productsToCheck.filter(p => p.parentId == null).forEach(p => {
            if (dfs(p)) {
                result = true;
            }
        });
        return result;
    }

    const beforeUpload = (file) => {
        const reader = new FileReader();
        reader.addEventListener("load", e => {
            let tempProducts = null;
            try {
                tempProducts = JSON.parse(e.target.result);
                let rootIds = Object.values(tempProducts).filter(p => p.parentId == null).map(p => p.id);
                if (Object.values(tempProducts).some(p => {
                    if (p.parentId != null && !tempProducts[p.parentId].childIds.includes(p.id)){
                        return true;
                    }
                    return p.childIds.some(id => tempProducts[id].parentId !== p.id);
                })){
                    api.error({
                        message: `Error`,
                        description: 'The concatenation of the elements is corrupted.',
                        placement: 'topRight',
                    });
                    return;
                }

                if (rootIds.length === 0) {
                    api.error({
                        message: `Error`,
                        description: 'The file does not contain any root elements, it is corrupted, or empty.',
                        placement: 'topRight',
                    });
                    return;
                }
                if (hasLoop(Object.values(tempProducts)) === true) {
                    api.error({
                        message: `Error`,
                        description: 'The file contains loops and cannot be processed.',
                        placement: 'topRight',
                    });
                    return;
                }

            } catch (e) {
                api.error({
                    message: `The file could not be read.`,
                    description: e,
                    placement: 'topRight',
                });
                return;
            }
            dispatch(setProducts(tempProducts));
        });
        reader.readAsText(file);
        return false;
    };

    const calculatePrice = (product) => {
        let childsPrice = product.childIds != null && product.childIds.length > 0 ? product.childIds.map(id => calculatePrice(products[id])).reduce((sum, p) => p + sum, 0) : 0.0;
        let sum = product.price + childsPrice;
        return (product.isKit ? (sum * 1.1) : sum)
    };

    return (
        <Col>
            <Row>
                <Card>
                    <Button type="primary" onClick={showModal}>Add Product</Button>
                    <Button type="primary" onClick={exportData}>Export Data</Button>
                    <Upload
                        beforeUpload={beforeUpload}
                        onChange = {() => {}}
                        showUploadList = {false}
                        accept = '.json'
                    >
                        <Button type="primary">Import Data</Button>
                    </Upload>
                </Card>
            </Row>
            {Object.keys(products).length > 0 ?  <Row>
                <Card>
                    <ProductTreeView setSelectedId={setSelectedId} selectedId={selectedId} />
                </Card>
            </Row> : null}
            {selectedId != null && products[selectedId] != null ? (<Row>
                <Card>
                    <p>
                        <label>Name: </label>{products[selectedId].name}
                    </p>
                    <p>
                        <label>Typ: </label>{products[selectedId].isKit ? 'Kit' : 'Component'}
                    </p>
                    <p>
                        <label>Price: </label>{calculatePrice(products[selectedId]).toFixed(2)}
                    </p>
                </Card>
            </Row>) : null }
            <ProductViewDialog isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}/>
        </Col>
    );
};

export default ProductView;