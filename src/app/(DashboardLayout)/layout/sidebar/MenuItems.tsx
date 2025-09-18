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
    subheader: "ESTRATEGIAS",
  },

  {
    id: uniqueId(),
    title: "Estrategias",
    icon: IconTent,
    href: "/",
  },
     {
    navlabel: true,
    subheader: "BLOG POSTS",
  },
  {
    id: uniqueId(),
    title: "Ideas",
    icon: IconLayoutDashboard,
    href: "/ideas",
  },

 /*  {
    id: uniqueId(),
    title: "Estructuras",
    icon: IconTent,
    href: "/estructuras",
  }, */
     {
    id: uniqueId(),
    title: "Estructuras",
    icon: IconAperture,
    href: "/estructuras",
  },
   {
    id: uniqueId(),
    title: "Articulos",
    icon: IconTypography,
    href: "/articulos",
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
/*   {
    id: uniqueId(),
    title: "Tonos",
    icon: IconCopy,
    href: "/utilities/shadow",
  },

  */

 

];

export default Menuitems;
