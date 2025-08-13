import React, { useState } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

import {
  Page,
  Card,
  FormLayout,
  Select,
  TextField,
  Button,
  Stack,
} from "@shopify/polaris";

const AddCategory = () => {
const categoryOptions = [
  { label: "Select category", value: "" },
  { label: "Bridal Jewelry", value: "bridal-jewelry" },
  { label: "Fashion / Costume Jewelry", value: "fashion-costume-jewelry" },
  { label: "Minimalist Jewelry", value: "minimalist-jewelry" },
  { label: "Fine Jewelry", value: "fine-jewelry" },
  { label: "High Jewelry", value: "high-jewelry" },
  { label: "Corporate / Achievement Jewelry", value: "corporate-achievement-jewelry" },
  { label: "Hip Hop / Urban Jewelry", value: "hip-hop-urban-jewelry" },
  { label: "Vintage / Antique Jewelry", value: "vintage-antique-jewelry" },
  { label: "Gothic Jewelry", value: "gothic-jewelry" },
  { label: "Nature / Organic Jewelry", value: "nature-organic-jewelry" },
];


  const [formData, setFormData] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (value, id) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Category selection is required.";
      isValid = false;
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/add-category", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to add category");

      await response.json();
      toast.success("Category added successfully", { autoClose: 2000 });
      navigate("/category");
      setFormData({ name: "", description: "" });
    } catch (error) {
      toast.error("Error adding category", { autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page fullWidth>
      {/* Gradient Overlay Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 z-10" />

      {/* Back button top-left */}
      <div style={{ position: "fixed", top: 20, left: 20, zIndex: 30 }}>
        <Button
          plain
          icon={<FaArrowLeftLong size={14} />}
          onClick={() => navigate(-1)}
          accessibilityLabel="Go back"
        >
          Back
        </Button>
      </div>

      {/* Centered Form container */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -100%)",
          width: "400px",
          zIndex: 20,
        }}
      >
        <Card sectioned>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "600",
              textAlign: "center",
              marginBottom: "50px",
              color: "#212b36",
            }}
          >
            Create Category
          </h1>

          <FormLayout onSubmit={handleSubmit}>
            <Select
              label={<span style={{ fontWeight: "600" }}>Category</span>}
              options={categoryOptions}
              onChange={(value) => handleChange(value, "name")}
              value={formData.name}
              error={errors.name}
              disabled={loading}
              required
            />
            <TextField
              label={<span style={{ fontWeight: "600" }}>Description</span>}
              value={formData.description}
              onChange={(value) => handleChange(value, "description")}
              multiline={4}
              error={errors.description}
              disabled={loading}
              required
            />
            <Stack distribution="center">
              <Button
                primary
                submit
                loading={loading}
                disabled={loading}
                accessibilityLabel="Add Category"
              >
                Add Category
              </Button>
            </Stack>
          </FormLayout>
        </Card>
      </div>

      <ToastContainer />
    </Page>
  );
};

export default AddCategory;
