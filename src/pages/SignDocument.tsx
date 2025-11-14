import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { FileText, CheckCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function SignDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [signatory, setSignatory] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    checkUserAndFetchDocument();
  }, [id]);

  const checkUserAndFetchDocument = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    
    setProfile(profileData);

    // Fetch document and signatory info
    const { data: docData } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    
    if (!docData) {
      toast({
        title: "Error",
        description: "Document not found",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setDocument(docData);

    // Check if user is a signatory
    const { data: sigData } = await supabase
      .from("signatories")
      .select("*")
      .eq("document_id", id)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!sigData) {
      toast({
        title: "Access Denied",
        description: "You are not authorized to sign this document",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setSignatory(sigData);
    setRemarks(sigData.remarks || "");
    setLoading(false);
  };

  const handleSign = async () => {
    if (!signatory || signatory.signed_at) return;

    setSigning(true);

    try {
      // Check if previous signatory has signed (if applicable)
      if (signatory.order_index > 0) {
        const { data: prevSignatory } = await supabase
          .from("signatories")
          .select("signed_at")
          .eq("document_id", id)
          .eq("order_index", signatory.order_index - 1)
          .maybeSingle();

        if (!prevSignatory || !prevSignatory.signed_at) {
          toast({
            title: "Cannot Sign",
            description: "Please wait for the previous signatory to sign first",
            variant: "destructive",
          });
          setSigning(false);
          return;
        }
      }

      // Update signatory with signature
      const { error: sigError } = await supabase
        .from("signatories")
        .update({
          signed_at: new Date().toISOString(),
          remarks: remarks,
        })
        .eq("id", signatory.id);

      if (sigError) throw sigError;

      // Check if all signatories have signed
      const { data: allSignatories } = await supabase
        .from("signatories")
        .select("signed_at")
        .eq("document_id", id);

      const allSigned = allSignatories?.every((s) => s.signed_at !== null);

      // Update document status
      const newStatus = allSigned ? "Completed" : "In Progress";
      const { error: docError } = await supabase
        .from("documents")
        .update({ status: newStatus })
        .eq("id", id);

      if (docError) throw docError;

      // Create audit log
      await supabase.from("audit_logs").insert({
        document_id: id,
        user_id: profile.id,
        action: "Document Signed",
        details: `Signatory ${signatory.order_index + 1} signed the document`,
      });

      toast({
        title: "Success",
        description: "Document signed successfully",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign document",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={profile} />
        <main className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={profile} />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Sign Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{document.title}</h3>
              <p className="text-sm text-muted-foreground">{document.description}</p>
              <div className="flex gap-4 text-sm">
                <span>
                  <strong>ID:</strong> {document.document_id}
                </span>
                <span>
                  <strong>Type:</strong> {document.document_type}
                </span>
                <span>
                  <strong>Department:</strong> {document.department}
                </span>
              </div>
            </div>

            {/* Document File */}
            {document.file_url && (
              <div className="border rounded-lg p-4">
                <Label>Document File</Label>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => window.open(document.file_url, '_blank')}
                >
                  View Document
                </Button>
              </div>
            )}

            {/* Signatory Status */}
            <div className="border rounded-lg p-4 space-y-2">
              <Label>Your Signing Status</Label>
              <div className="flex items-center gap-2">
                {signatory.signed_at ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">
                      Signed on {new Date(signatory.signed_at).toLocaleDateString()}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Position: Signatory {signatory.order_index + 1}
                  </span>
                )}
              </div>
            </div>

            {/* QR Code for Verification */}
            <div className="border rounded-lg p-4 flex flex-col items-center">
              <Label className="mb-4">Document QR Code</Label>
              <QRCodeSVG 
                value={`${window.location.origin}/sign/${id}`}
                size={200}
                level="H"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Scan to verify and sign
              </p>
            </div>

            {/* Remarks */}
            {!signatory.signed_at && (
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any remarks or comments"
                  rows={3}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                disabled={signing}
                className="flex-1"
              >
                Back to Dashboard
              </Button>
              {!signatory.signed_at && (
                <Button
                  onClick={handleSign}
                  disabled={signing}
                  className="flex-1"
                >
                  {signing ? "Signing..." : "Sign Document"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
