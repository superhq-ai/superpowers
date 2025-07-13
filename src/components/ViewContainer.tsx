import React from 'react';

type Props = {
    children: React.ReactNode;
};

const ViewContainer = ({ children }: Props) => {
    return (
        <div className="flex flex-col flex-1 overflow-y-auto relative z-10">
            {children}
        </div>
    );
};

export default ViewContainer;
