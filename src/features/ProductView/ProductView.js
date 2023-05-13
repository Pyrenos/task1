import React, { useState } from 'react';
import { addProduct, selectProducts, changeHierarchy, deleteProduct, setProducts } from "./productsSlice";
import { useSelector, useDispatch } from 'react-redux';
import { Button, Space, Modal, InputNumber, Input, Select, Tree, Switch, notification, Upload } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import './productView.css'
const ProductView = () => {
    const [api, contextHolder] = notification.useNotification();
    const products = useSelector(selectProducts);
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [name, setName] = useState("");
    const [price, setPrice] = useState(null);
    const [isKit, setIsKit] = useState(false);
    const [parentId, setParentId] = useState(-1);
    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        let p = isKit ? 0 : parseFloat(price)
        dispatch(addProduct({
            name: name,
            price: p,
            childIds: [],
            isKit: isKit,
            parentId: parentId >= 0 ? parentId : null
        }))
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        setSelectedId(null);
        dispatch(deleteProduct({
            id: id
        }))
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

    const selectOptions = Object.values(products).filter(p => p.isKit).map(p => { return { value: p.id, label: p.name }}).concat([{ value: -1, label: 'None (Kit)'}]);

    const getHiearchy = (Ids) => {
        if (Ids == null || Ids.length === 0) {
            return [];
        }
        let result = [];
        Ids.forEach(pId  => {
            let p = products[pId];
            let title = (<div>
                <span className={p.isKit === true ? 'kit': 'component'} onClick={() => { setSelectedId(p.id) }}>{p.name}</span>
                <DeleteOutlined onClick={ () => { handleDelete(p.id); }}/>
            </div>);
            result.push({
                title: title,
                key: p.id,
                children: getHiearchy(p.childIds)
            });
        });
        return result;
    }

    const treeData = getHiearchy(Object.values(products).filter(p => p.parentId == null).map(p => p.id));

    const onDrop = (info) => {
        const dropPos = info.node.pos.split('-');
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
        let newParentId = dropPosition === 0 ? info.node.key : null;
        if (newParentId != null) {
            let parent = products[newParentId];
            if (!parent.isKit) {
                api.error({
                    message: `Error`,
                    description: "You cannot attach this item to a component.",
                    placement: 'topRight',
                });
                return;
            }
        }
        dispatch(changeHierarchy({
            currentId: info.dragNode.key,
            newParentId: newParentId
        }));
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
                    if (p.childIds.some(id => tempProducts[id].parentId !== p.id)) {
                        return true;
                    }
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
        return product.isKit ? (sum * 1.1) : sum;
    };

    return (
        <div>
            {contextHolder}
            {JSON.stringify(products,null,4)}<br />
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

            { selectedId != null ? (<Space>
                <p>
                    <label>Name: </label>{products[selectedId].name}
                </p>
                <p>
                    <label>Price: </label>{calculatePrice(products[selectedId])}
                </p>
            </Space>) : null }
            <Tree
                className="draggable-tree"
                treeData={treeData}
                draggable
                blockNode
                onDrop={onDrop}
            />
            <Modal title="Basic Modal" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} okText="Add" cancelText="Cancel">
                <Input
                    placeholder="Name of Product"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <label>Component</label><Switch onChange={r => setIsKit(r)} /><label>Kit</label>
                {isKit ? null : (<InputNumber
                    value={price}
                    placeholder={"Price"}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                    onChange={setPrice}
                />)}

                {selectOptions.length > 0 ? (<Select
                    defaultValue={null}
                    style={{ width: 120 }}
                    options={selectOptions}
                    value={parentId}
                    onChange={id => setParentId(id)}
                />) : null}
            </Modal>
        </div>
    );
};

export default ProductView;