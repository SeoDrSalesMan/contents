import {
  IconAperture,
  IconCopy,
  IconLayoutDashboard,
  IconLogin,
  IconMoodHappy,
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
    subheader: "CONFIGURACIONES",
  },
  {
    id: uniqueId(),
    title: "Clientes",
    icon: IconUserPlus,
    href: "/authentication/register",
  },
  {
    id: uniqueId(),
    title: "Tonos",
    icon: IconCopy,
    href: "/utilities/shadow",
  },

 

 

];

export default Menuitems;


