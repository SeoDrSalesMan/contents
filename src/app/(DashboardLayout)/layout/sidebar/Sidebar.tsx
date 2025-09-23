import { useMediaQuery, Box, Drawer, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import SidebarItems from "./SidebarItems";
import { useContentSettings } from "../../components/content/ContentSettingsContext";
import { Logo } from "react-mui-sidebar";
import Link from "next/link";



interface ItemType {
  isMobileSidebarOpen: boolean;
  onSidebarClose: (event: React.MouseEvent<HTMLElement>) => void;
  isSidebarOpen: boolean;
}

const MSidebar = ({
  isMobileSidebarOpen,
  onSidebarClose,
  isSidebarOpen,
}: ItemType) => {
  const { clients, selectedClientId, setSelectedClientId } = useContentSettings();
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));

  const sidebarWidth = "270px";

  // Custom CSS for short scrollbar
  const scrollbarStyles = {
    '&::-webkit-scrollbar': {
      width: '7px',

    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#eff2f7',
      borderRadius: '15px',
    },
  };


  if (lgUp) {
    return (
      <Box
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
        }}
      >
        {/* ------------------------------------------- */}
        {/* Sidebar for desktop */}
        {/* ------------------------------------------- */}
        <Drawer
          anchor="left"
          open={isSidebarOpen}
          variant="permanent"
          slotProps={{
            paper: {
              sx: {
                boxSizing: "border-box",
                ...scrollbarStyles,
                width: sidebarWidth,
                backgroundColor: 'grey.50',
              },
            }
          }}
        >
          {/* ------------------------------------------- */}
          {/* Sidebar Box */}
          {/* ------------------------------------------- */}
          <Box
            sx={{
              height: "100%",
            }}
          >
            <Box sx={{ p: 2 }}>
              <Logo img='/images/logos/dark-logo.png' component={Link} to="/" >Modernize</Logo>
            </Box>
            <Box sx={{ p: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="cliente-sidebar-sel-label">Cliente</InputLabel>
                <Select
                  labelId="cliente-sidebar-sel-label"
                  id="cliente-sidebar-sel"
                  value={selectedClientId}
                  label="Cliente"
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Seleccionar Cliente</em>
                  </MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              {/* ------------------------------------------- */}
              {/* Sidebar Items */}
              {/* ------------------------------------------- */}
              <SidebarItems />
            </Box>
          </Box>
        </Drawer>
      </Box >
    );
  }

  return (
    <Drawer
      anchor="left"
      open={isMobileSidebarOpen}
      onClose={onSidebarClose}
      variant="temporary"

      slotProps={{
        paper: {
          sx: {
            boxShadow: (theme) => theme.shadows[8],
            ...scrollbarStyles,
          },
        }
      }}
    >
      {/* ------------------------------------------- */}
      {/* Sidebar Box */}
      {/* ------------------------------------------- */}
      <Box>
        <Box sx={{ p: 2 }}>
          <Logo img='/images/logos/dark-logo.png' component={Link} to="/" >Modernize</Logo>
        </Box>
        <Box sx={{ p: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="cliente-sidebar-sel-label-mobile">Cliente</InputLabel>
            <Select
              labelId="cliente-sidebar-sel-label-mobile"
              id="cliente-sidebar-sel-mobile"
              value={selectedClientId}
              label="Cliente"
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <MenuItem value="">
                <em>Seleccionar Cliente</em>
              </MenuItem>
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {/* ------------------------------------------- */}
        {/* Sidebar Items */}
        {/* ------------------------------------------- */}
        <SidebarItems />
      </Box>
      {/* ------------------------------------------- */}
      {/* Sidebar For Mobile */}
      {/* ------------------------------------------- */}
    </Drawer>
  );
};

export default MSidebar;
