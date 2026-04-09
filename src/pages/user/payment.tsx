import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import {
  fetchFlaggedPayments,
  verifyPaymentAPI,
} from "../../store/slices/paymentSlice";
import { Column } from "../../types";
import {
  Layout,
  PageHeader,
  Card,
  Table,
  Button,
  Badge,
  Modal,
  Input,
  Select,
} from "../../components";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";

export default function PaymentReviewPage() {
  const dispatch = useDispatch();

  const { flaggedPayments, loading } = useSelector(
    (s: RootState) => s.payments
  );

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "verified" | "flagged" | "rejected"
  >("verified");
  const [notes, setNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    dispatch(fetchFlaggedPayments() as any);
  }, [dispatch]);

  const handleVerify = async () => {
    if (!selectedPayment) return;

    setVerifying(true);
    try {
      await dispatch(
        verifyPaymentAPI({
          bookingId: selectedPayment.bookingId,
          paymentId: selectedPayment.paymentId,
          status: verificationStatus,
          notes: notes || undefined,
        }) as any
      ).unwrap();

      alert("✅ Payment verification completed!");
      setSelectedPayment(null);
      setNotes("");
      dispatch(fetchFlaggedPayments() as any);
    } catch (err: any) {
      alert(err?.message || "Failed to verify payment");
    } finally {
      setVerifying(false);
    }
  };

  const columns: Column[] = [
    {
      key: "bookingId",
      label: "Booking ID",
      render: (v: string) => (
        <span className="font-mono text-xs">{v.slice(0, 8)}</span>
      ),
    },
    {
      key: "paymentId",
      label: "Payment ID",
      render: (v: string) => (
        <span className="font-mono text-xs">{v || "N/A"}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (v: number) => (
        <span className="font-bold text-rotary-royal">₹{v}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v: string) => <Badge variant="pending">{v}</Badge>,
    },
    {
      key: "createdAt",
      label: "Date",
      render: (v: string) => (
        <span className="text-sm text-rotary-darkgray">
          {new Date(v).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: any) => (
        <Button
          size="sm"
          onClick={() => setSelectedPayment(row)}
        >
          <Eye className="w-3 h-3 mr-1" />
          Review
        </Button>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader
        title="Payment Review"
        subtitle="Review and verify flagged payments"
      />

      <Card padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-rotary-royal animate-spin" />
          </div>
        ) : flaggedPayments.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-rotary-darkgray">No flagged payments</p>
          </div>
        ) : (
          <Table columns={columns} data={flaggedPayments} />
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={selectedPayment !== null}
        onClose={() => !verifying && setSelectedPayment(null)}
        title="Review Payment"
        size="md"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-yellow-900 mb-2">
                    Flagged Payment
                  </div>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <div>Booking ID: {selectedPayment.bookingId}</div>
                    <div>Payment ID: {selectedPayment.paymentId || "N/A"}</div>
                    <div className="font-bold">
                      Amount: ₹{selectedPayment.amount}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Select
              label="Verification Status"
              options={[
                { value: "verified", label: "Verified - Approve Payment" },
                { value: "flagged", label: "Keep Flagged - Need More Info" },
                { value: "rejected", label: "Rejected - Invalid Payment" },
              ]}
              value={verificationStatus}
              onChange={(e) =>
                setVerificationStatus(
                  e.target.value as "verified" | "flagged" | "rejected"
                )
              }
            />

            <Input
              label="Notes (Optional)"
              placeholder="Add verification notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button fullWidth onClick={handleVerify} disabled={verifying}>
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Verification
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setSelectedPayment(null)}
                disabled={verifying}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}