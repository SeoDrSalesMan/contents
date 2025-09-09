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
    title: "Ideas",
    icon: IconLayoutDashboard,
    href: "/",
  },
 /*  {
    id: uniqueId(),
    title: "Estructuras",
    icon: IconTent,
    href: "/estructuras",
  }, */
     {
    id: uniqueId(),
    title: "Estrategias RRSS",
    icon: IconAperture,
    href: "/rrss",
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
