import React, {useState, useEffect} from "react";
import {CategoryContent} from "./CategoryContent";

export function Category(props){
    const [isAllCategories, setIsAllCategories] = useState(false);
    const {isAdd, setAdd} = useState(false);

    return (
        <div className="d-flex flex-wrap w-100 p-4">
            <div className="d-flex flex-wrap w-100 m-2">
                <p>All Categories</p>
            </div>
            <div className="d-flex flex-wrap w-100">
                <h4>Tapware & Accessories</h4>
            </div>
            {
                isAllCategories ? <CategoryContent
                    isAdd = {isAdd}
                    setAdd = {setAdd}
                />
                 : <div className="d-flex flex-wrap w-100">
                    <div className="d-flex flex-wrap mt-2 w-100 bg-white p-2 rounded shadow-sm">
                        <div className="d-flex" onClick={() => setIsAllCategories(true)}>
                            <span>View All</span>
                            <span><img src="assets/ui/arrow-right.svg"/></span>
                        </div>
                            
                    </div>
                    <div className="d-flex flex-wrap mt-2 w-100 bg-white p-2 rounded shadow-sm">
                        Shower & Bath Tapware
                    </div>
                </div>
            }
            
        </div>)
}