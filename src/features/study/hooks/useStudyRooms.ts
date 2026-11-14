import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QKEY_STUDY_ROOMS } from "@/constants/queryKeys";
import { deleteStudyRoom, getStudyRooms, removeStudyMember } from "@/services/study";
import { apiErrorMessage } from "../utils/studyState";

/** Rooms the signed-in player is in. */
export const useStudyRooms = () =>
  useQuery({ queryKey: [QKEY_STUDY_ROOMS], queryFn: getStudyRooms });

/** Delete a room you own, or leave one you were invited to. */
export const useLeaveOrDeleteRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { roomId: number; userId: number; owner: boolean }) =>
      input.owner ? deleteStudyRoom(input.roomId) : removeStudyMember(input.roomId, input.userId),
    onSuccess: (_, { owner }) => {
      toast.success(owner ? "Room deleted" : "You left the room");
      return queryClient.invalidateQueries({ queryKey: [QKEY_STUDY_ROOMS] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Something went wrong. Try again.")),
  });
};
