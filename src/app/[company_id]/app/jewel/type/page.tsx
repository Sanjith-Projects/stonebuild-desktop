        "use client";
       
       import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
       import { FormField } from "../../utils/formField";
       import { Button } from "@/components/ui/button";
       import { postRequest } from "../../utils/api";
       import { useEffect, useState } from "react";
       import toast from "react-hot-toast";
       import ConfirmModal from "../../utils/confirmationModal";
import { Icon, PenIcon } from "lucide-react";
       
       type JewelType = {
         id?: string;
         jewel_type: string;
         jewel_purity: string;
         status?: string;
       };
       
       export default function JewelTypeForm() {
         const methods = useForm<JewelType>({
           defaultValues: {
             jewel_type: "",
             jewel_purity: "",
           },
         });
       
         const [loading, setLoading] = useState(false);
         const [showConfirm, setShowConfirm] = useState(false);
         const [formData, setFormData] = useState<JewelType | null>(null);
         const [jewelList, setJewelList] = useState<JewelType[]>([]);
         const [editId, setEditId] = useState<string | null>(null);
       
         // 🔹 Fetch list
         const fetchJewelTypes = async () => {
           try {
             const payload = { token: "getJewelType" };
             const res = await postRequest(payload);
             if (res.success && Array.isArray(res.data)) {
               setJewelList(res.data);
             } else {
               setJewelList([]);
             }
           } catch {
             toast.error("Failed to load jewel types ❌");
           }
         };
       
         useEffect(() => {
           fetchJewelTypes();
         }, []);
       
         // 🔹 Handle form submit
         const handleFormSubmit: SubmitHandler<JewelType> = (data) => {
           setFormData(data);
           setShowConfirm(true);
         };
       
        // 🔹 Confirm submit
const confirmSubmit = async () => {
  if (!formData) return;
  setLoading(true);

  try {
    const payload = {
      token: editId ? "updateJewelType" : "addJewelType",
      data: editId ? { ...formData, id: editId } : formData,
    };

    const res = await postRequest(payload);
    if (res.success) {
      toast.success(editId ? "Updated successfully ✅" : "Added successfully ✅");

      // ✅ Clear form fields after successful submit
      methods.reset({
        jewel_type: "",
        jewel_purity: "",
      });

      setEditId(null);
      fetchJewelTypes();
    } else {
      toast.error(res.message || "Operation failed ❌");
    }
  } catch (err: any) {
    toast.error(err.message || "Something went wrong ❌");
  } finally {
    setLoading(false);
    setShowConfirm(false);
    setFormData(null);
  }
};

       
         // 🔹 Edit
         const handleEdit = (item: JewelType) => {
           methods.reset({
             jewel_type: item.jewel_type,
             jewel_purity: item.jewel_purity,
           });
           setEditId(item.id || null);
         };
       
        
         const Row = ({
           label,
           children,
         }: {
           label: string;
           children: React.ReactNode;
         }) => (
           <div className="flex items-center justify-between gap-4">
             <label className="w-1/3 font-medium text-gray-700 text-[17px]">{label}</label>
             <div className="w-2/3">{children}</div>
           </div>
         );
       
         return (
           <FormProvider {...methods}>
            <div    className="  bg-white     ">
             <form
               onSubmit={methods.handleSubmit(handleFormSubmit)}
               className="flex flex-col   p-6"
             >
               <div className="space-y-4 border-b     ">
                 
       
                 <Row label="Jewel Type">
                   <FormField
                     type="input"
                     name="jewel_type"
                     placeholder="Enter jewel type"
                   />
                 </Row>
       
                 <Row label="Jewel Purity">
                   <FormField
                     type="input"
                     name="jewel_purity"
                     placeholder="Enter jewel purity"
                   />
                 </Row>
                   <Row label="">
                      <Button
                   type="submit"
                   disabled={loading}
                   className="bg-[#103BB5] text-white hover:bg-[#256b45]  mb-5"
                 >
                   {loading ? "Saving..." : editId ? "Update" : "Submit"}
                 </Button>
                 </Row>
               </div>
       
              
             </form>
        
             {/* 🔹 List Section */}
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto border rounded-lg">
    <table className="  table-default">
      <thead className=" sticky top-0 z-10">
                   <tr>
                     <th className="  text-center  ">#</th>
                     <th className="  text-left  ">Jewel Type</th>
                     <th className="  text-left  ">Purity</th> 
                     
                     <th className="  text-center  ">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {jewelList.length > 0 ? (
                     jewelList.map((item, index) => (
                       <tr key={item.id} className="border-t hover:bg-gray-50">
                         <td className="  text-center  ">{index + 1}</td>
                         <td className="   ">{item.jewel_type}</td>
                         <td className="   ">{item.jewel_purity}</td>
                         
                         <td className="  text-center    ">
                          <span className="cursor-pointer" onClick={() => handleEdit(item)}>
                           <PenIcon name="edit"  size={12} className="mr-3 inline-block text-[14px] ml-1 cursor-pointer" />
                           
                           
                             Edit 
                             </span>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr>
                       <td colSpan={5} className="text-center p-4 text-gray-500">
                         No Jewel Types Found
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
       </div>
             {/* 🔹 Confirmation Modal */}
             <ConfirmModal
               open={showConfirm}
               onCancel={() => setShowConfirm(false)}
               onConfirm={confirmSubmit}
               loading={loading}
               title="Confirm Submission"
               message={
                 editId
                   ? "Are you sure you want to update this jewel type?"
                   : "Are you sure you want to add this jewel type?"
               }
             />
           </FormProvider>
         );
       }
       