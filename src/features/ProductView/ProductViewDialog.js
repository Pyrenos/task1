import React, {useState} from 'react';
import {Input, InputNumber, Modal, Select, Switch, Row, Col, Space} from "antd";
import {addProduct, selectProducts} from "./productsSlice";
import {useDispatch, useSelector} from "react-redux";
import './productViewDialog.css';
const ProductViewDialog = (props) => {
    const products = useSelector(selectProducts);

    const dispatch = useDispatch();
    const [name, setName] = useState("");
    const [price, setPrice] = useState(null);
    const [isKit, setIsKit] = useState(false);
    const [parentId, setParentId] = useState(-1);

    const handleOk = () => {
        let p = 0;
        if (isKit === false) {
            p = parseFloat(price);
            if (isNaN(p)) {
                p = 0;
            }
        }
        dispatch(addProduct({
            name: name,
            price: p,
            childIds: [],
            isKit: isKit,
            parentId: parentId >= 0 ? parentId : null
        }))
        props.setIsModalOpen(false);
    };

    const handleCancel = () => {
        props.setIsModalOpen(false);
    };

    const selectOptions = Object.values(products).filter(p => p.isKit).map(p => { return { value: p.id, label: p.name }}).concat([{ value: -1, label: 'As root'}]);

    return (
        <Modal title="Basic Modal" open={props.isModalOpen} onOk={handleOk} onCancel={handleCancel} okText="Add" cancelText="Cancel">
            <Col>
                <Row className="dialogRow">
                    <Space>
                        <Input
                            placeholder="Name of Product"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </Space>
                </Row>
                <Row className="dialogRow">
                    <Space>
                        <Switch checkedChildren="Kit" unCheckedChildren="Component" onChange={r => setIsKit(r)} />
                    </Space>
                </Row>
                {isKit ? null : (<Row className="dialogRow">
                    <Space>
                        <InputNumber
                            value={price}
                            placeholder={"Price"}
                            formatter={(value) => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/,/g, '.').replace(/\€\s?|(,*)/g, '')}
                            onChange={setPrice}
                        />
                    </Space>
                </Row>)}
                {selectOptions.length > 1 ? (<Row className="dialogRow">
                        <Select
                            defaultValue={null}
                            style={{ width: 120 }}
                            options={selectOptions}
                            value={parentId}
                            onChange={id => setParentId(id)}
                        />
                    </Row>
                ) : null}
            </Col>
        </Modal>
    );
};

export default ProductViewDialog;