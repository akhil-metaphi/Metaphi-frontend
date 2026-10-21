import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMasterItem, fetchMasterById, fetchMasterList, fetchNextItemCode, updateMasterItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import SelectWithClear from "../../components/SelectWithClear/SelectWithClear";
import "../UserManagement/UserForm.css";

interface DropdownOption { id: number; name: string; status?: string; }
interface SubCategoryOption { id: number; name: string; categoryId: number; status?: string; categoryStatus?: string; }
interface HsnItem { id: number; hsn_code: string; gst_id?: number; gst_rate?: number; gst_name?: string; status?: string; gst_status?: string; }
interface GstItem { id: number; rate?: number; gst_name?: string; status?: string; }

const ItemForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryOption[]>([]);
  const [units, setUnits] = useState<DropdownOption[]>([]);
  const [hsnList, setHsnList] = useState<HsnItem[]>([]);
  const [gstList, setGstList] = useState<GstItem[]>([]);

  const [itemName, setItemName] = useState("");
  const [alternateName, setAlternateName] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [color, setColor] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [hsnId, setHsnId] = useState("");
  const [gstId, setGstId] = useState("");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [toastError, setToastError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetchMasterList<{ id: number; category_name: string; status?: string }>("categories", { limit: 100 }),
      fetchMasterList<{ id: number; sub_category_name: string; category_id: number; status?: string; category_status?: string }>("sub-categories", { limit: 100 }),
      fetchMasterList<{ id: number; unit_name: string; status?: string }>("units", { limit: 100 }),
      fetchMasterList<HsnItem>("hsn", { limit: 100 }),
      fetchMasterList<GstItem>("gst", { limit: 100 }),
    ]).then(([cRes, scRes, uRes, hRes, gRes]) => {
      setCategories(cRes.data.items.map((i) => ({ id: i.id, name: i.category_name, status: i.status })));
      setSubCategories(scRes.data.items.map((i) => ({ id: i.id, name: i.sub_category_name, categoryId: i.category_id, status: i.status, categoryStatus: i.category_status })));
      setUnits(uRes.data.items.map((i) => ({ id: i.id, name: i.unit_name, status: i.status })));
      setHsnList(hRes.data.items);
      setGstList(gRes.data.items);
    }).catch(() => {});

    if (isEdit && id) {
      setFetching(true);
      fetchMasterById<{
        item_name: string; alternate_name: string; item_code: string; color: string; category_id: number; sub_category_id: number;
        unit_id: number; hsn_id: number; gst_id: number; reorder_level: number; price: number;
        description: string; remarks: string; status: string;
      }>("items", id)
        .then((res) => {
          const item = res.data;
          setItemName(item.item_name || "");
          setAlternateName(item.alternate_name || "");
          setItemCode(item.item_code || "");
          setColor(item.color || "");
          setCategoryId(item.category_id ? String(item.category_id) : "");
          setSubCategoryId(item.sub_category_id ? String(item.sub_category_id) : "");
          setUnitId(item.unit_id ? String(item.unit_id) : "");
          setHsnId(item.hsn_id ? String(item.hsn_id) : "");
          setGstId(item.gst_id ? String(item.gst_id) : "");
          setReorderLevel(String(item.reorder_level || 10));
          setPrice(item.price != null ? String(item.price) : "");
          setDescription(item.description || "");
          setRemarks(item.remarks || "");
          setStatus(item.status || "Active");
        })
        .catch((err) => setToastError(err.message))
        .finally(() => setFetching(false));
    } else {
      fetchNextItemCode().then((code) => setItemCode(code));
    }
  }, [id, isEdit]);

  const handleCategoryChange = (selectedCatId: string) => {
    setCategoryId(selectedCatId);
    if (fieldErrors.categoryId) setFieldErrors((prev) => ({ ...prev, categoryId: "" }));
    if (!selectedCatId || (selectedCatId && subCategoryId)) {
      const valid = subCategories.some(
        (sc) => String(sc.id) === subCategoryId && String(sc.categoryId) === selectedCatId
      );
      if (!valid) setSubCategoryId("");
    }
  };

  const handleHsnChange = (selectedHsnId: string) => {
    setHsnId(selectedHsnId);
    if (fieldErrors.hsnId) setFieldErrors((prev) => ({ ...prev, hsnId: "" }));
    if (!selectedHsnId) {
      setGstId("");
      return;
    }
    const foundHsn = hsnList.find((h) => String(h.id) === selectedHsnId);
    if (foundHsn && foundHsn.gst_id) {
      setGstId(String(foundHsn.gst_id));
      if (fieldErrors.gstId) setFieldErrors((prev) => ({ ...prev, gstId: "" }));
    }
  };

  const handlePriceChange = (val: string) => {
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setPrice(val);
      if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: "" }));
    }
  };

  const filteredSubCategories = subCategories.filter((sc) => {
    const isCategoryMatch = categoryId ? String(sc.categoryId) === categoryId : true;
    const isCategoryActive = sc.categoryStatus !== "Inactive";
    const isSubCategoryActive = sc.status !== "Inactive";
    return isCategoryMatch && isCategoryActive && isSubCategoryActive;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!itemName.trim()) errors.itemName = "Item name is required";
    if (!alternateName.trim()) errors.alternateName = "Alternate name is required";
    if (!itemCode.trim()) errors.itemCode = "Item code is required";
    if (!categoryId) {
      errors.categoryId = "Category is required";
    } else if (!categories.some((c) => String(c.id) === categoryId && c.status !== "Inactive")) {
      errors.categoryId = "Selected Category is inactive. Please choose an active category";
    }

    if (!subCategoryId) {
      errors.subCategoryId = "Sub category is required";
    } else if (!subCategories.some((sc) => String(sc.id) === subCategoryId && sc.status !== "Inactive" && sc.categoryStatus !== "Inactive")) {
      errors.subCategoryId = "Selected Sub Category is inactive. Please choose an active sub category";
    }

    if (!hsnId) {
      errors.hsnId = "HSN code is required";
    } else if (!hsnList.some((h) => String(h.id) === hsnId && h.status !== "Inactive" && h.gst_status !== "Inactive")) {
      errors.hsnId = "Selected HSN Code is inactive. Please choose an active HSN code";
    }

    if (!unitId) {
      errors.unitId = "Unit is required";
    } else if (!units.some((u) => String(u.id) === unitId && u.status !== "Inactive")) {
      errors.unitId = "Selected Unit is inactive. Please choose an active unit";
    }

    if (!gstId) errors.gstId = "GST percentage is required";
    if (!price.trim()) errors.price = "Selling price is required";
    else if (isNaN(Number(price)) || Number(price) < 0) errors.price = "Enter a valid numeric price";
    if (!color) errors.color = "Color is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setLoading(true); setToastError("");
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const payload = {
        itemName, alternateName, itemCode, color,
        categoryId: Number(categoryId), subCategoryId: Number(subCategoryId),
        unitId: Number(unitId), hsnId: Number(hsnId), gstId: Number(gstId),
        reorderLevel: Number(reorderLevel) || 10, price: Number(price),
        description, remarks, status, createdBy: currentUser?.id, updatedBy: currentUser?.id
      };
      if (isEdit && id) {
        await updateMasterItem("items", id, payload);
        navigate("/item", { state: { toastMessage: "Item updated successfully" } });
      } else {
        await createMasterItem("items", payload);
        navigate("/item", { state: { toastMessage: "Item created successfully" } });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to save item";
      setToastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="page-container"><div className="page-card">Loading Item...</div></div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/item")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title">{isEdit ? "Edit Item" : "Add Item"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Item &gt; <span>{isEdit ? "Edit Item" : "Add Item"}</span>
          </div>
        </div>

        {toastError && (
          <Toast message={toastError} type="error" duration={3000} onClose={() => setToastError("")} />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px 20px" }}>
            {/* Row 1 */}
            <div className="form-field">
              <label>Item Name <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.itemName ? "input-error" : ""}
                placeholder="Enter Item Name"
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                  if (fieldErrors.itemName) setFieldErrors((prev) => ({ ...prev, itemName: "" }));
                }}
              />
              {fieldErrors.itemName && <span className="field-error-msg">{fieldErrors.itemName}</span>}
            </div>

            <div className="form-field">
              <label>Alternate Name <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.alternateName ? "input-error" : ""}
                placeholder="Enter Alternate Name"
                value={alternateName}
                onChange={(e) => {
                  setAlternateName(e.target.value);
                  if (fieldErrors.alternateName) setFieldErrors((prev) => ({ ...prev, alternateName: "" }));
                }}
              />
              {fieldErrors.alternateName && <span className="field-error-msg">{fieldErrors.alternateName}</span>}
            </div>

            <div className="form-field">
              <label>Item Code <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.itemCode ? "input-error" : ""}
                placeholder="Item Code"
                value={itemCode}
                onChange={(e) => {
                  setItemCode(e.target.value);
                  if (fieldErrors.itemCode) setFieldErrors((prev) => ({ ...prev, itemCode: "" }));
                }}
              />
              {fieldErrors.itemCode && <span className="field-error-msg">{fieldErrors.itemCode}</span>}
            </div>

            <div className="form-field">
              <label>Category <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.categoryId ? "input-error" : ""}
                value={categoryId}
                placeholder="Select Category"
                options={categories
                  .filter((c) => c.status !== "Inactive")
                  .map((c) => ({ value: c.id, label: c.name }))}
                onChange={(e) => handleCategoryChange(e.target.value)}
                onClear={() => handleCategoryChange("")}
              />
              {fieldErrors.categoryId && <span className="field-error-msg">{fieldErrors.categoryId}</span>}
            </div>

            {/* Row 2 */}
            <div className="form-field">
              <label>Sub Category <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.subCategoryId ? "input-error" : ""}
                value={subCategoryId}
                placeholder="Select Sub Category"
                options={filteredSubCategories
                  .map((sc) => ({ value: sc.id, label: sc.name }))}
                onChange={(e) => {
                  setSubCategoryId(e.target.value);
                  if (fieldErrors.subCategoryId) setFieldErrors((prev) => ({ ...prev, subCategoryId: "" }));
                }}
                onClear={() => {
                  setSubCategoryId("");
                  if (fieldErrors.subCategoryId) setFieldErrors((prev) => ({ ...prev, subCategoryId: "" }));
                }}
              />
              {fieldErrors.subCategoryId && <span className="field-error-msg">{fieldErrors.subCategoryId}</span>}
            </div>

            <div className="form-field">
              <label>HSN Code <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.hsnId ? "input-error" : ""}
                value={hsnId}
                placeholder="Select HSN Code"
                options={hsnList
                  .filter((h) => h.status !== "Inactive" && h.gst_status !== "Inactive")
                  .map((h) => ({ value: h.id, label: h.hsn_code }))}
                onChange={(e) => handleHsnChange(e.target.value)}
                onClear={() => {
                  setHsnId("");
                  setGstId("");
                  if (fieldErrors.hsnId) setFieldErrors((prev) => ({ ...prev, hsnId: "" }));
                  if (fieldErrors.gstId) setFieldErrors((prev) => ({ ...prev, gstId: "" }));
                }}
              />
              {fieldErrors.hsnId && <span className="field-error-msg">{fieldErrors.hsnId}</span>}
            </div>

            <div className="form-field">
              <label>Unit <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.unitId ? "input-error" : ""}
                value={unitId}
                placeholder="Select Unit"
                options={units
                  .filter((u) => u.status !== "Inactive")
                  .map((u) => ({ value: u.id, label: u.name }))}
                onChange={(e) => {
                  setUnitId(e.target.value);
                  if (fieldErrors.unitId) setFieldErrors((prev) => ({ ...prev, unitId: "" }));
                }}
                onClear={() => {
                  setUnitId("");
                  if (fieldErrors.unitId) setFieldErrors((prev) => ({ ...prev, unitId: "" }));
                }}
              />
              {fieldErrors.unitId && <span className="field-error-msg">{fieldErrors.unitId}</span>}
            </div>

            <div className="form-field">
              <label>GST % <span className="required">*</span></label>
              <input
                type="text"
                readOnly
                disabled
                className={fieldErrors.gstId ? "input-error" : ""}
                placeholder="Select HSN Code"
                value={
                  gstId
                    ? (() => {
                        const foundGst = gstList.find((g) => String(g.id) === String(gstId));
                        if (foundGst) {
                          return foundGst.rate != null ? `${parseFloat(String(foundGst.rate))}%` : (foundGst.gst_name || "");
                        }
                        const foundHsn = hsnList.find((h) => String(h.id) === String(hsnId));
                        return foundHsn && foundHsn.gst_rate != null ? `${foundHsn.gst_rate}%` : "";
                      })()
                    : ""
                }
              />
              {fieldErrors.gstId && <span className="field-error-msg">{fieldErrors.gstId}</span>}
            </div>

            {/* Row 3 */}
            <div className="form-field">
              <label>Selling Price <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.price ? "input-error" : ""}
                placeholder="Enter Selling Price"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
              />
              {fieldErrors.price && <span className="field-error-msg">{fieldErrors.price}</span>}
            </div>

            <div className="form-field">
              <label>Color <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.color ? "input-error" : ""}
                value={color}
                placeholder="Select Color"
                options={[
                  { value: "Black", label: "Black" },
                  { value: "White", label: "White" },
                ]}
                onChange={(e) => {
                  setColor(e.target.value);
                  if (fieldErrors.color) setFieldErrors((prev) => ({ ...prev, color: "" }));
                }}
                onClear={() => {
                  setColor("");
                  if (fieldErrors.color) setFieldErrors((prev) => ({ ...prev, color: "" }));
                }}
              />
              {fieldErrors.color && <span className="field-error-msg">{fieldErrors.color}</span>}
            </div>

            <div className="form-field">
              <label>Remark</label>
              <input type="text" placeholder="Enter Remark" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>

            <div>{/* Empty 4th cell of row 3 */}</div>
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "32px", borderTop: "none", paddingTop: 0 }}>
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/item")}>Cancel</button>
            <button type="submit" className="btn-wizard-next" disabled={loading}>{loading ? "Saving..." : isEdit ? "Update" : "Add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemForm;
