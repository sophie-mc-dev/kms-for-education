import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button,
} from "@material-tailwind/react";

export function ModuleDetails() {
  
  
  return (
    <div className="mt-12 flex gap-4 h-full">
      module details here
      {/* displays resources and modules table info, 
      after the resources display it has a multiple questions quiz 
      back and next buttons if within a learning path (find best way of display)*/}
    </div>
  );
}

export default ModuleDetails;
