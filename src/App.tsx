import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/Login/ForgotPassword";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard/Dashboard";
import UserList from "./pages/UserManagement/UserList";
import UserForm from "./pages/UserManagement/UserForm";
import UserPermissions from "./pages/UserManagement/UserPermissions";

// Masters pages
import CategoryList from "./pages/Masters/CategoryList";
import CategoryForm from "./pages/Masters/CategoryForm";
import SubCategoryList from "./pages/Masters/SubCategoryList";
import SubCategoryForm from "./pages/Masters/SubCategoryForm";
import UnitList from "./pages/Masters/UnitList";
import UnitForm from "./pages/Masters/UnitForm";
import GstList from "./pages/Masters/GstList";
import GstForm from "./pages/Masters/GstForm";
import HsnList from "./pages/Masters/HsnList";
import HsnForm from "./pages/Masters/HsnForm";
import LabourList from "./pages/Masters/LabourList";
import LabourForm from "./pages/Masters/LabourForm";
import WarehouseList from "./pages/Masters/WarehouseList";
import WarehouseForm from "./pages/Masters/WarehouseForm";
import ConfigureWarehouse from "./pages/Masters/ConfigureWarehouse";
import CustomerList from "./pages/Masters/CustomerList";
import CustomerForm from "./pages/Masters/CustomerForm";
import CustomerDetails from "./pages/Masters/CustomerDetails";
import SupplierList from "./pages/Masters/SupplierList";
import SupplierForm from "./pages/Masters/SupplierForm";
import ItemList from "./pages/Masters/ItemList";
import ItemForm from "./pages/Masters/ItemForm";
import ItemDetails from "./pages/Masters/ItemDetails";

// Warehouse pages
import WarehouseOverview from "./pages/Warehouse/WarehouseOverview";
import ItemInwardList from "./pages/Warehouse/ItemInwardList";
import ItemInwardForm from "./pages/Warehouse/ItemInwardForm";
import DispatchList from "./pages/Warehouse/DispatchList";
import DispatchForm from "./pages/Warehouse/DispatchForm";

// Inventory pages
import InStockList from "./pages/Inventory/InStockList";
import ReorderLevelList from "./pages/Inventory/ReorderLevelList";

// Order pages
import EnquiryList from "./pages/Order/EnquiryList";
import QuotationList from "./pages/Order/QuotationList";
import SiteVisitList from "./pages/Order/SiteVisitList";
import OrderList from "./pages/Order/OrderList";
import OrderForm from "./pages/Order/OrderForm";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* User Management */}
            <Route path="/user-list" element={<UserList />} />
            <Route path="/users/create" element={<UserForm />} />
            <Route path="/users/:id/edit" element={<UserForm />} />
            <Route path="/users/:id/permissions" element={<UserPermissions />} />

            {/* Masters Routes */}
            {/* Category */}
            <Route path="/category" element={<CategoryList />} />
            <Route path="/add-category" element={<CategoryForm />} />
            <Route path="/edit-category/:id" element={<CategoryForm />} />

            {/* Sub Category */}
            <Route path="/sub-category" element={<SubCategoryList />} />
            <Route path="/add-sub-category" element={<SubCategoryForm />} />
            <Route path="/edit-sub-category/:id" element={<SubCategoryForm />} />

            {/* Unit */}
            <Route path="/unit" element={<UnitList />} />
            <Route path="/add-unit" element={<UnitForm />} />
            <Route path="/edit-unit/:id" element={<UnitForm />} />

            {/* GST */}
            <Route path="/gst" element={<GstList />} />
            <Route path="/add-gst" element={<GstForm />} />
            <Route path="/edit-gst/:id" element={<GstForm />} />

            {/* HSN Code */}
            <Route path="/hsn-codes" element={<HsnList />} />
            <Route path="/add-hsn-code" element={<HsnForm />} />
            <Route path="/edit-hsn-code/:id" element={<HsnForm />} />

            {/* Labour */}
            <Route path="/labour" element={<LabourList />} />
            <Route path="/add-labour" element={<LabourForm />} />
            <Route path="/edit-labour/:id" element={<LabourForm />} />

            {/* Warehouse */}
            <Route path="/warehouse-list" element={<WarehouseList />} />
            <Route path="/add-warehouse" element={<WarehouseForm />} />
            <Route path="/edit-warehouse/:id" element={<WarehouseForm />} />
            <Route path="/configure-warehouse/:id" element={<ConfigureWarehouse />} />

            {/* Customer */}
            <Route path="/customer" element={<CustomerList />} />
            <Route path="/customer-list" element={<CustomerList />} />
            <Route path="/add-customer" element={<CustomerForm />} />
            <Route path="/edit-customer/:id" element={<CustomerForm />} />
            <Route path="/customer-details/:id" element={<CustomerDetails />} />

            {/* Supplier */}
            <Route path="/supplier-list" element={<SupplierList />} />
            <Route path="/add-supplier" element={<SupplierForm />} />
            <Route path="/edit-supplier/:id" element={<SupplierForm />} />

            {/* Item */}
            <Route path="/item" element={<ItemList />} />
            <Route path="/add-item" element={<ItemForm />} />
            <Route path="/edit-item/:id" element={<ItemForm />} />
            <Route path="/item-details/:id" element={<ItemDetails />} />

            {/* Warehouse Module */}
            <Route path="/warehouse-overview" element={<WarehouseOverview />} />
            <Route path="/warehouse-item-inward" element={<ItemInwardList />} />
            <Route path="/warehouse-item-inward/create" element={<ItemInwardForm />} />
            <Route path="/warehouse-item-inward/edit/:id" element={<ItemInwardForm />} />
            <Route path="/warehouse-dispatch" element={<DispatchList />} />
            <Route path="/warehouse-dispatch/create" element={<DispatchForm />} />
            <Route path="/warehouse-dispatch/edit/:id" element={<DispatchForm />} />

            {/* Inventory Module */}
            <Route path="/inventory-in-stock" element={<InStockList />} />
            <Route path="/inventory-dispatch" element={<DispatchList />} />
            <Route path="/inventory-reorder-level" element={<ReorderLevelList />} />
            <Route path="/inventory-order" element={<OrderList />} />

            {/* Order Module */}
            <Route path="/enquiry" element={<EnquiryList />} />
            <Route path="/order-enquiry" element={<EnquiryList />} />
            <Route path="/order-enquiry/create" element={<OrderForm />} />
            <Route path="/order-enquiry/edit/:id" element={<OrderForm />} />

            <Route path="/quotation" element={<QuotationList />} />
            <Route path="/order-quotation" element={<QuotationList />} />
            <Route path="/order-quotation/create" element={<OrderForm />} />
            <Route path="/order-quotation/edit/:id" element={<OrderForm />} />

            <Route path="/sitevisit" element={<SiteVisitList />} />
            <Route path="/site-visit" element={<SiteVisitList />} />
            <Route path="/order-site-visit" element={<SiteVisitList />} />
            <Route path="/order-site-visit/create" element={<OrderForm />} />
            <Route path="/order-site-visit/edit/:id" element={<OrderForm />} />

            <Route path="/order-list" element={<OrderList />} />
            <Route path="/order-list/create" element={<OrderForm />} />
            <Route path="/order-list/edit/:id" element={<OrderForm />} />
          </Route>
        </Route>

        {/* Default Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;