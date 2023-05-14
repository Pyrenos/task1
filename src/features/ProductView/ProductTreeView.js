import React from 'react';
import {notification, Tree} from "antd";
import {DeleteOutlined, InfoCircleOutlined} from "@ant-design/icons";
import {changeHierarchy, deleteProduct, selectProducts } from "./productsSlice";
import { useSelector, useDispatch } from 'react-redux';
import './productTreeView.css'
const ProductTreeView = (props) => {
    const products = useSelector(selectProducts);
    const dispatch = useDispatch();
    const [api, contextHolder] = notification.useNotification();
    const getHiearchy = (Ids) => {
        if (Ids == null || Ids.length === 0) {
            return [];
        }
        let result = [];
        Ids.forEach(pId  => {
            let p = products[pId];
            let title = (<div className='treeRow'>
                <span className={p.isKit === true ? 'kit': 'component'} >{p.name}</span>
                <InfoCircleOutlined
                    onClick={() => { props.setSelectedId(p.id) }}
                />
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
    const handleDelete = (id) => {
        props.setSelectedId(null);
        dispatch(deleteProduct({
            id: id
        }))
    };

    const onDrop = (info) => {
        const dropPos = info.node.pos.split('-');
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
        let newParentId = dropPosition === 0 ? info.node.key : null;
        if (newParentId != null) {
            let parent = products[newParentId];
            if (!parent.isKit) {
                api.error({
                    message: `Error`,
                    description: "You cannot attach this item to a simple component.",
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

    const treeData = getHiearchy(Object.values(products).filter(p => p.parentId == null).map(p => p.id));

    return (
        <div>
            <Tree
                treeData={treeData}
                draggable
                blockNode
                onDrop={onDrop}
            />
        </div>
    );
};

export default ProductTreeView;