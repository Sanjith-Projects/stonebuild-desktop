 "use client";
import {
  useForm,
  FormProvider,
  SubmitHandler,
  useFieldArray,
} from "react-hook-form";
import { FormField } from "../utils/formField";
import { Button } from "@/components/ui/button";
import { postRequest } from "../utils/api";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "../utils/confirmationModal";
import { format } from "date-fns";             // <-- add this

type Phase = {
  phase_name: string;
  phase_description: string;
  budget: string;
};

type Member = {
  contact_id: string;
  designation_id: string;
};

type FormValues = {
  project_name: string;
  project_address: string;
  start_date: string;
  end_date: string;
  members: Member[];
  phases: Phase[];
};
type Option = { label: string; value: string };

export default function ProjectForm() {
        const todayStr = format(new Date(), "dd/MM/yyyy"); 
      const [contactTypeOptions, setContactTypeOptions] = useState<Option[]>([]);

      setContactTypeOptions
            const [contacts, setContacts] = useState<Option[]>([]);

    
  const methods = useForm<FormValues>({
    defaultValues: {
      project_name: "",
      project_address: "",
      start_date: todayStr,
      end_date: todayStr,
      members: [
        {
          contact_id: "",
          designation_id: "",
        },
      ],
      phases: [
        {
          phase_name: "",
          phase_description: "",
          budget: "",
        },
      ],
    },
  });

  const { control } = methods;

  // Members field array
  const {
    fields: memberFields,
    append: appendMember,
    remove: removeMember,
  } = useFieldArray({
    control,
    name: "members",
  });

  // Phases field array
  const {
    fields: phaseFields,
    append: appendPhase,
    remove: removePhase,
  } = useFieldArray({
    control,
    name: "phases",
  });

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<FormValues | null>(null);

  const handleFormSubmit: SubmitHandler<FormValues> = (data) => {
    setFormData(data);
    setShowConfirm(true);
  };


   useEffect(() => {
      fetchContactTypes();
     fetchContacts() ;
    }, []);



  const confirmSubmit = async () => {
    if (!formData) return;
    setLoading(true);
    try {
      const payload = {
        // 🔁 change token as per your backend
        token: "addProject",
        data: formData,
      };
      const res = await postRequest(payload);
      if (res.success) {
        toast.success("Project added successfully ✅");
        methods.reset();
      } else {
        toast.error(res.message || "Failed to add project ❌");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setFormData(null);
    }
  };

  const handleCancel = () => {
    methods.reset();
    setFormData(null);
    setShowConfirm(false);
  };

  const Row = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between gap-4">
      <label className="w-1/3 font-medium text-gray-700 text-[15px]">
        {label}
      </label>
      <div className="w-2/3">{children}</div>
    </div>
  );

  // Calculate total budget from phases only
  const phases = methods.watch("phases") || [];
  const totalBudget = phases.reduce((sum, phase) => {
    const value = parseFloat(phase?.budget || "0");
    return sum + (isNaN(value) ? 0 : value);
  }, 0);



    const fetchContactTypes = async () => {
      try {
      const payload = {
       token: "getLedgerType",
        data: { ledger_type: "contact_ledger" },
      };
      const res = await postRequest(payload);
      if (res && res.success && Array.isArray(res.data)) {
        const opts = res.data.map((u: any) => ({
          label: u.ledger_name ??String(u.value ?? ""),
          value: String(u.id ??""),
        }));
        setContactTypeOptions(opts);
      } else {
        // API returned non-success or non-array -> empty options
        setContactTypeOptions([]);
        toast.error("Units API returned no data.");
      }
    } catch (err) {
      setContactTypeOptions([]);
      toast.error("Failed to load units from API ❌");
    } 
  };



  
    const fetchContacts = async () => {
      try {
      const payload = {
       token: "getContacts",
        
      };
      const res = await postRequest(payload);
      if (res && res.success && Array.isArray(res.data)) {
        const opts = res.data.map((u: any) => ({
          label: u.full_name ??String(u.full_name ?? ""),
          value: String(u.id ??""),
        }));
        setContacts(opts);
      } else {
          setContacts([]);
        toast.error("Units API returned no data.");
      }
    } catch (err) {
      setContacts([]);
      toast.error("Failed to load units from API ❌");
    } 
  };




  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleFormSubmit)}
        className="flex flex-col bg-white py-6"
      >
        <div className="flex-1 max-h-[calc(100vh-180px)] overflow-y-auto px-3 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* LEFT SIDE: BASIC PROJECT DETAILS */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Row label="Project Name">
                  <FormField
                    type="input"
                    name="project_name"
                    placeholder="Enter Project Name"
                    className="capitalize"
                    validation={{ required: "Project Name is required" }}
                  />
                </Row>

                <Row label="Project Address">
                  <FormField
                    type="textarea"
                    name="project_address"
                    placeholder="Enter Project Address"
                    validation={{ required: "Project Address is required" }}
                  />
                </Row>

                <Row label="Start Date">
                  <FormField
                    type="datepicker"
                    name="start_date"
                    placeholder="Enter Start Date"
                    validation={{ required: "Start Date is required" }}
                  />
                </Row>

                <Row label="End Date (Approx)">
                  <FormField
                    type="datepicker"
                    name="end_date"
                    placeholder="Enter Approx End Date"
                    validation={{ required: "End Date is required" }}
                  />
                </Row>
              </div>
            </div>

            {/* RIGHT SIDE: PROJECT MEMBERS TABLE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mt-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800">
                  Project Members
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendMember({
                      contact_id: "",
                      designation_id: "",
                    })
                  }
                  disabled={loading}
                >
                  + Add Member
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="table-default w-full">
                    <thead className=" sticky top-0 z-10 bg-white">
                      <tr>
                        <th className="">S.No</th>
                        <th className="">Member Name</th>
                        <th className="">Member Designation</th>
                        <th className="">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberFields.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 py-4 text-center text-gray-500"
                          >
                            No Members added. Click &quot;Add Member&quot; to
                            start.
                          </td>
                        </tr>
                      )}

                      {memberFields.map((field, index) => (
                        <tr key={field.id} className="border-t">
                          <td className=" text-gray-700">{index + 1}</td>

                          <td className="">
                            <FormField
                              type="typeahead"
                              name={`members.${index}.contact_id`}
                              placeholder="Member Name"
                                options={contacts}
                              validation={{
                                required: "Member Name is required",
                              }}

                            />
                          </td>

                          <td className="">
                            <FormField
                              type="typeahead"
                              name={`members.${index}.designation_id`}
                              options={contactTypeOptions}
                              placeholder="Member Designation"
                            />
                          </td>

                          <td className=" text-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeMember(index)}
                              disabled={loading}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* PROJECT PHASES SECTION */}
          <div className="flex items-center justify-between mt-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Project Phases
            </h2>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendPhase({
                  phase_name: "",
                  phase_description: "",
                  budget: "",
                })
              }
              disabled={loading}
            >
              + Add Phase
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-default w-full">
                <thead className=" sticky top-0 z-10 bg-white">
                  <tr>
                    <th className="">S.No</th>
                    <th className="">Phase Name</th>
                    <th className="">Phase Description</th>
                    <th className="">Budget</th>
                    <th className="">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {phaseFields.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        No phases added. Click &quot;Add Phase&quot; to start.
                      </td>
                    </tr>
                  )}

                  {phaseFields.map((field, index) => (
                    <tr key={field.id} className="border-t">
                      <td className=" text-gray-700">{index + 1}</td>

                      <td className="">
                        <FormField
                          type="input"
                          name={`phases.${index}.phase_name`}
                          placeholder="Phase Name"
                          validation={{
                            required: "Phase Name is required",
                          }}
                        />
                      </td>

                      <td className="">
                        <FormField
                          type="input"
                          name={`phases.${index}.phase_description`}
                          placeholder="Phase Description"
                        />
                      </td>

                      <td className="">
                        <FormField
                          type="input"
                          name={`phases.${index}.budget`}
                          placeholder="Budget"
                          className="only-number no-space"
                        />
                      </td>

                      <td className=" text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePhase(index)}
                          disabled={loading}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTAL BUDGET ROW */}
            <div className="border-t px-3 py-2 flex justify-end">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-700">
                  Total Budget:
                </span>
                <span className="font-bold text-gray-900">
                  {totalBudget.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER WITH SUBMIT + CANCEL */}
        <footer className="fixed bottom-0 left-68 w-[calc(100%-16rem)] bg-white border-t py-2 px-6 flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button variant="default" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </footer>
      </form>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loading}
        title="Confirm Submission"
        message="Are you sure you want to add this project?"
      />
    </FormProvider>
  );
}
