import {
  IconAperture,
  IconCopy,
  IconLayoutDashboard,
  IconLogin,
  IconMoodHappy,
  IconTent,
  IconTypography,
  IconUserPlus,
} from "@tabler/icons-react";

import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "CONTENIDOS",
  },

  {
    id: uniqueId(),
    title: "Estrategias",
    icon: IconLayoutDashboard,
    href: "/",
  },
  {
    id: uniqueId(),
    title: "Estructuras",
    icon: IconTent,
    href: "/estructuras",
  },
   {
    id: uniqueId(),
    title: "Articulos",
    icon: IconTypography,
    href: "/articulos",
  },
   
   {
    id: uniqueId(),
    title: "RRSS",
    icon: IconAperture,
    href: "/rrss",
  },
  {
    navlabel: true,
    subheader: "SISTEMA",
  },
  {
    id: uniqueId(),
    title: "Configuracion",
    icon: IconUserPlus,
    href: "/configuracion",
  },
  {
    id: uniqueId(),
    title: "Tonos",
    icon: IconCopy,
    href: "/utilities/shadow",
  },

 

 

];

export default Menuitems;
