"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import * as React from "react";
import { Alert } from "@mui/material";
import { firestore } from "@/firebase";
import {
  Box,
  Modal,
  TextField,
  Typography,
  Stack,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  InputBase,
} from "@mui/material";
import {
  collection,
  getDocs,
  query,
  getDoc,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { styled, alpha } from "@mui/material/styles";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [total, setTotal] = useState(0);
  const [distinctTotal, setDistinctTotal] = useState(0);
  const [quant, setQuantity] = useState('');
  const [updateOpen, setUpdateOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // State for current item to update
  const [errorMessage, setErrorMessage] = useState(''); // State for error message
  const [searchQuery, setSearchQuery] = useState(''); // State for search query

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, "inventory"));
    const docs = await getDocs(snapshot);
    let tot = 0;
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
    docs.forEach((doc) => {
      tot = tot + doc.data().quantity;
    });
    setInventory(inventoryList);
    setTotal(inventoryList.length);
    setDistinctTotal(tot);
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }

    await updateInventory();
  };

  const updateItem = async () => {
    if (currentItem) {
      const docRef = doc(collection(firestore, "inventory"), currentItem.name);
      try {
        await setDoc(docRef, { 
          name: itemName,
          quantity: parseInt(quant)  // Ensure quantity is an integer
        }, {merge: true});
        await updateInventory();
        handleUpdateClose();
      } catch (error) {
        setErrorMessage('Failed to update item. Please try again.');
        console.error("Error updating document: ", error);
      }
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleUpdateOpen = (item) => {
    setCurrentItem(item);
    setItemName(item.name);
    setQuantity(item.quantity);
    setUpdateOpen(true);
  };
  const handleUpdateClose = () => {
    setUpdateOpen(false);
    setCurrentItem(null);
    setItemName("");
    setQuantity("");
    setErrorMessage('');
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{ bgcolor: '#353b37' }}>
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="open drawer"
              sx={{ mr: 2 }}
            ></IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
            >
              MyInventory Tracker
            </Typography>
            <Search>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ "aria-label": "search" }}
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </Search>
          </Toolbar>
        </AppBar>
      </Box>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection={"column"}
        gap={2}
      >
        <Modal open={open} onClose={handleClose}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width={400}
            bgcolor="white"
            border="2px solid #000"
            boxShadow={24}
            p={4}
            display="flex"
            flexDirection={"column"}
            gap={3}
            sx={{
              transform: "translate(-50%, -50%)",
            }}
          >
            <Typography variant="h6">Add Item</Typography>
            <Stack width="100%" direction="row" spacing={2}>
              <TextField
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                }}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  addItem(itemName);
                  setItemName("");
                  handleClose();
                }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>
        <Box sx={{ width: '100%', display: 'flex', paddingTop: "20px", paddingLeft: "20px", margin: "0px", ustifyContent: 'flex-start', marginBottom: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              handleOpen();
            }}
          >
            Add New Items
          </Button>
        </Box>
        <Box border="1px solid #333">
          <Box
            width="800px"
            height="100px"
            bgcolor="#ADD8E6"
            display={"flex"}
            justifyContent="center"
            alignItems="center"
            margin="20px"
          >
            <Typography variant="h2" color="#333" >
              Inventory Items
            </Typography>
          </Box>
          {/* Displaying the Buttons */}
          <Stack width="800px" height="300px" spacing={2} overflow="auto">
            {filteredInventory.map((item) => (
              <Box
                key={item.name}
                width="100%"
                minHeight="150px"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                bgcolor="#f0f0f0"
                padding={5}
              >
                <Typography variant="h3" color="#333" textAlign={"center"}>
                  {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                </Typography>
                <Typography variant="h3" color="#333" textAlign={"center"}>
                  {item.quantity}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      addItem(item.name);
                    }}
                  >
                    Add
                  </Button>
                  {/* Update Functionality */}
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleUpdateOpen(item);
                    }}
                  >
                    Update Items
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      removeItem(item.name);
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
          <Box className="flex justify-between p-3">
            <Typography variant="h4" color="#333">Total Distinct Items: {total}</Typography>
            <Typography variant="h4" color="#333">
              Total Items: {distinctTotal}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Modal open={updateOpen} onClose={handleUpdateClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={500}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection={"column"}
          gap={3}
          sx={{
            transform: "translate(-50%, -50%)",
          }}
        >
          <Typography variant="h6">Update Item</Typography>
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              label="Name"
              onChange={(e) => {
                setItemName(e.target.value);
              }}
            />
            <TextField
              variant="outlined"
              fullWidth
              type="number"
              value={quant}
              label="Quantity"
              onChange={(e) => {
                setQuantity(e.target.value);
              }}
            />
            <Button
              variant="outlined"
              sx={{ width: '200px' }}
              onClick={() => {
                updateItem();
              }}
            >
              Update
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
