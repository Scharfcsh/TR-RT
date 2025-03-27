import React from "react";

const Badge = ({ color = "blue", value }) => {
  return (
    <span 
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-${color}-100 text-${color}-800`}
    >
      {value}
    </span>
  );
};

export default Badge;

