import React from "react";
import ReactDOM from "react-dom";

import TraceView from  "./component/TraceView"; 

const traceConfig = {
    data: {
        "name": "Root",
        "children": [{
            "name": "Branch 1"
        },
        {
            "name": "Branch 2"
        },
        {
            "name": "Branch 3"
        },
        {
            "name": "Branch 4"
        }]
    },
    nodeWidth: 182,
    nodeHeight: 77
};

ReactDOM.render(
    <TraceView traceConfig={ traceConfig } />, document.getElementById('root')
);